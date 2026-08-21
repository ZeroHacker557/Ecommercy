import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatPrice } from '../data'
import { subscribeToCategories, subscribeToProducts, sendOrderToFirestore, saveUserToFirestore, subscribeToUserOrders } from '../lib/firebase'
import type { AppPage, Category, Order, OrderForm, Product } from '../types/domain'
import { hapticFeedback, hapticSuccess, initTelegram, getTelegramUser } from '../utils/telegram'

const ORDERS_KEY = 'shopOnlineOrders'
const LIKES_KEY = 'shopOnlineLikes'

function loadOrders(): Order[] {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]')
  } catch { return [] }
}

function saveOrders(orders: Order[]) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
}

function loadLikes(): number[] {
  try {
    return JSON.parse(localStorage.getItem(LIKES_KEY) || '[]')
  } catch { return [] }
}

function saveLikes(ids: number[]) {
  localStorage.setItem(LIKES_KEY, JSON.stringify(ids))
}

export function useShopStore() {
  const [page, setPage] = useState<AppPage>('home')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [likedIds, setLikedIds] = useState<number[]>(loadLikes)
  const [cartItems, setCartItems] = useState<Record<number, number>>({})
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isSearchOpen, setSearchOpen] = useState(false)
  const [isCartOpen, setCartOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [myOrders, setMyOrders] = useState<Order[]>(loadOrders)
  const [checkoutDone, setCheckoutDone] = useState(false)
  const [orderForm, setOrderForm] = useState<OrderForm>({
    name: '', phone: '', address: '', location: null, comment: '', paymentMethod: 'Naqd',
  })

  // Initialize Telegram & Firebase real-time subscriptions
  useEffect(() => {
    initTelegram()
    setLoading(true)

    // Handle User
    const tgUser = getTelegramUser()
    if (tgUser) {
      saveUserToFirestore(tgUser)
    }

    // 1. Subscribe to Firestore products
    const unsubProds = subscribeToProducts(
      (fbProducts) => {
        setProducts(fbProducts)
        setLoading(false)
      },
      () => {
        setLoading(false)
      }
    )

    // 2. Subscribe to Firestore categories
    const unsubCats = subscribeToCategories(
      (fbCats) => {
        setCategories(fbCats)
      },
      () => {}
    )

    // 3. Subscribe to User Orders
    let unsubOrders: (() => void) | undefined
    if (tgUser) {
      unsubOrders = subscribeToUserOrders(tgUser.id, (orders) => {
        setMyOrders(orders)
      })
    }

    return () => {
      unsubProds()
      unsubCats()
      if (unsubOrders) unsubOrders()
    }
  }, [])

  const cartCount = Object.values(cartItems).reduce((total, qty) => total + qty, 0)

  const cartTotal = useMemo(() => {
    return Object.entries(cartItems).reduce((sum, [id, qty]) => {
      const p = products.find((pr) => String(pr.id) === String(id))
      return sum + (p ? p.price * qty : 0)
    }, 0)
  }, [cartItems, products])

  const cartProducts = useMemo(() => {
    return Object.entries(cartItems)
      .map(([id, qty]) => {
        const p = products.find((pr) => String(pr.id) === String(id))
        return p ? { product: p, quantity: qty } : null
      })
      .filter(Boolean) as { product: Product; quantity: number }[]
  }, [cartItems, products])

  const searchResults = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
    [query, products],
  )

  const navigate = useCallback((nextPage: AppPage) => {
    setPage(nextPage)
    setCartOpen(false)
    setSearchOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const openProduct = useCallback((product: Product) => {
    setSelectedProduct(product)
    setCartOpen(false)
    setPage('detail')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    hapticFeedback('light')
  }, [])

  const toggleLike = useCallback((id: number) => {
    setLikedIds((current) => {
      const next = current.includes(id) ? current.filter((i) => i !== id) : [...current, id]
      saveLikes(next)
      hapticFeedback('light')
      return next
    })
  }, [])

  const notify = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(null), 2600)
  }, [])

  const addToCart = useCallback((product: Product) => {
    setCartItems((current) => ({ ...current, [product.id]: (current[product.id] ?? 0) + 1 }))
    notify(`${product.name} savatga qo'shildi`)
    hapticFeedback('medium')
  }, [notify])

  const updateCartQuantity = useCallback((productId: number, nextQuantity: number) => {
    setCartItems((current) => {
      const next = { ...current }
      if (nextQuantity <= 0) delete next[productId]
      else next[productId] = nextQuantity
      return next
    })
    hapticFeedback('light')
  }, [])

  const openCart = useCallback(() => setCartOpen(true), [])
  const closeCart = useCallback(() => setCartOpen(false), [])

  const goToCheckout = useCallback(() => {
    setCartOpen(false)
    setPage('checkout')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const updateOrderForm = useCallback((field: keyof OrderForm, value: any) => {
    setOrderForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const submitOrder = useCallback(async () => {
    if (!orderForm.name || !orderForm.phone || !orderForm.address) {
      notify('Iltimos, barcha maydonlarni to\'ldiring')
      return false
    }

    const now = new Date()
    const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']
    const dateStr = `${now.getDate()} ${months[now.getMonth()]}, ${now.getFullYear()} • ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    
    const tgUser = getTelegramUser()

    const newOrder: Order = {
      id: `#${Date.now().toString().slice(-7)}`,
      date: dateStr,
      products: cartProducts,
      total: cartTotal,
      status: 'Yangi',
      paymentMethod: orderForm.paymentMethod,
      paymentStatus: orderForm.paymentMethod === 'Karta' ? 'Kutilmoqda' : undefined,
      customer: { ...orderForm },
      userId: tgUser?.id,
      username: tgUser?.username || tgUser?.first_name,
    }

    // Send to Firestore
    await sendOrderToFirestore(newOrder)

    // Reset
    setCartItems({})
    setOrderForm({ name: '', phone: '', address: '', location: null, comment: '', paymentMethod: 'Naqd' })
    setCheckoutDone(true)
    hapticSuccess()
    notify('Buyurtma muvaffaqiyatli berildi! ✓')
    setTimeout(() => setCheckoutDone(false), 4000)

    return true
  }, [orderForm, cartProducts, cartTotal, notify])

  return {
    page, products, categories, loading,
    cartItems, cartCount, cartTotal, cartProducts,
    likedIds, selectedProduct,
    isSearchOpen, isCartOpen, query, searchResults, toast,
    myOrders, checkoutDone, orderForm,
    navigate, openProduct, toggleLike,
    setSearchOpen, setQuery,
    addToCart, updateCartQuantity,
    openCart, closeCart, goToCheckout,
    updateOrderForm, submitOrder,
    notify, clearToast: () => setToast(null),
    refreshData: () => {},
  }
}
