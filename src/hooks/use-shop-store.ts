import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatPrice } from '../data'
import { subscribeToCategories, subscribeToProducts, sendOrderToFirestore, saveUserToFirestore, subscribeToUserOrders, subscribeToUserProfile, subscribeToUserNotifications, markNotificationsAsRead } from '../lib/firebase'
import type { AppPage, Category, Order, OrderForm, Product, UserProfile, Notification } from '../types/domain'
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
  const [cartItems, setCartItems] = useState<Record<string, { quantity: number; size?: string; color?: string }>>({})
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)

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

    let unsubOrders: (() => void) | undefined
    let unsubProfile: (() => void) | undefined
    let unsubNotifications: (() => void) | undefined
    if (tgUser) {
      unsubOrders = subscribeToUserOrders(tgUser.id, (orders) => {
        setMyOrders(orders)
      })
      unsubProfile = subscribeToUserProfile(tgUser.id, (profile) => {
        if (profile) setUserProfile(profile as UserProfile)
      })
      unsubNotifications = subscribeToUserNotifications(tgUser.id, (notifs) => {
        setNotifications(notifs)
        setUnreadNotificationsCount(notifs.filter((n: Notification) => !n.read).length)
      })
    }

    return () => {
      unsubProds()
      unsubCats()
      if (unsubOrders) unsubOrders()
      if (unsubProfile) unsubProfile()
      if (unsubNotifications) unsubNotifications()
    }
  }, [])

  const cartCount = Object.values(cartItems).reduce((total, item) => total + item.quantity, 0)

  const cartTotal = useMemo(() => {
    return Object.entries(cartItems).reduce((sum, [key, item]) => {
      const pId = Number(key.split('_')[0])
      const p = products.find((pr) => String(pr.id) === String(pId))
      return sum + (p ? p.price * item.quantity : 0)
    }, 0)
  }, [cartItems, products])

  const cartProducts = useMemo(() => {
    return Object.entries(cartItems)
      .map(([key, item]) => {
        const pId = Number(key.split('_')[0])
        const p = products.find((pr) => String(pr.id) === String(pId))
        return p ? { product: p, quantity: item.quantity, size: item.size, color: item.color, cartKey: key } : null
      })
      .filter(Boolean) as { product: Product; quantity: number; size?: string; color?: string; cartKey: string }[]
  }, [cartItems, products])

  const searchResults = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
    [query, products],
  )

  const navigate = useCallback((nextPage: AppPage) => {
    const tgUser = getTelegramUser()
    if (nextPage === 'notifications' && tgUser) {
      markNotificationsAsRead(tgUser.id)
    }
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

  const addToCart = useCallback((product: Product, size?: string, color?: string) => {
    const s = size || product.sizes?.[0] || 'nosize'
    const c = color || product.color || 'nocolor'
    const key = `${product.id}_${s}_${c}`
    setCartItems((current) => ({
      ...current,
      [key]: {
        quantity: (current[key]?.quantity ?? 0) + 1,
        size: size || product.sizes?.[0],
        color: color || product.color
      }
    }))
    notify(`${product.name} savatga qo'shildi`)
    hapticFeedback('medium')
  }, [notify])

  const updateCartQuantity = useCallback((cartKey: string, nextQuantity: number) => {
    setCartItems((current) => {
      const next = { ...current }
      if (nextQuantity <= 0) delete next[cartKey]
      else next[cartKey] = { ...next[cartKey], quantity: nextQuantity }
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

  const submitOrder = useCallback(async (finalTotal: number) => {
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
      total: finalTotal,
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
    myOrders, checkoutDone, orderForm, userProfile,
    notifications, unreadNotificationsCount,
    navigate, openProduct, toggleLike,
    setSearchOpen, setQuery,
    addToCart, updateCartQuantity,
    openCart, closeCart, goToCheckout,
    updateOrderForm, submitOrder,
    notify, clearToast: () => setToast(null),
    refreshData: () => {},
  }
}
