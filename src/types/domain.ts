export type AppPage = 'home' | 'catalog' | 'favorites' | 'orders' | 'profile' | 'detail' | 'checkout'

export type Product = {
  id: number
  name: string
  price: number
  oldPrice?: number
  category: string
  color?: string
  rating: number
  reviews: number
  images: string[]
  description?: string
  discount?: string
  sizes?: string[]
}

export type Category = {
  id: number
  name: string
  icon: string
  image?: string
}

export type OrderStatus = 'Yangi' | 'Qabul qilindi' | 'Yetkazilmoqda' | 'Yetkazildi' | 'Bekor qilingan' | 'Rad etildi'

export type Order = {
  id: string
  date: string
  products: { product: Product; quantity: number }[]
  total: number
  status: OrderStatus
  paymentMethod?: 'Naqd' | 'Karta'
  paymentStatus?: 'Tolangan' | 'Kutilmoqda' | 'Rad etildi'
  customer: OrderForm
  userId?: number
  username?: string
}

export type OrderForm = {
  name: string
  phone: string
  address: string
  location: { lat: number; lng: number } | null
  comment: string
  paymentMethod: 'Naqd' | 'Karta'
}

export type ProductActions = {
  onOpen: (product: Product) => void
  onAddToCart: (product: Product) => void
  likedIds: number[]
  onToggleLike: (id: number) => void
}

export type CartItem = {
  productId: number
  quantity: number
}
