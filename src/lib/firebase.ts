import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, onSnapshot, query, where, doc, setDoc, updateDoc, writeBatch, getDocs } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import type { Product, Category, Order } from '../types/domain'

const firebaseConfig = {
  apiKey: "AIzaSyB-JENf9xTOJcEF81-6KJxb0HnCyLmjkc0",
  authDomain: "ecommercytest.firebaseapp.com",
  projectId: "ecommercytest",
  storageBucket: "ecommercytest.firebasestorage.app",
  messagingSenderId: "107932467075",
  appId: "1:107932467075:web:1d2740db24de18661c00b6",
  measurementId: "G-TFYZD2LLN0"
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Real-time Firestore Listeners
export function subscribeToProducts(callback: (products: Product[]) => void, onError?: (err: unknown) => void) {
  console.log('[Firebase] Subscribing to products collection...')
  const productsRef = collection(db, 'products')
  return onSnapshot(productsRef, (snapshot) => {
    console.log(`[Firebase] Products snapshot received: ${snapshot.size} documents`)
    const products: Product[] = snapshot.docs.map((doc) => {
      const data = doc.data()
      const rawId = data.id || doc.id
      const numId = typeof rawId === 'number' ? rawId : (parseInt(String(rawId), 10) || Math.abs(hashString(doc.id)))
      
      return {
        id: numId,
        name: data.name || '',
        price: Number(data.price) || 0,
        oldPrice: data.oldPrice ? Number(data.oldPrice) : undefined,
        category: data.category || '',
        images: data.images || [],
        rating: data.rating || 5,
        reviews: data.reviews || 0,
        sizes: data.sizes || [],
        color: data.color || '',
        description: data.description || '',
        discount: data.discount || ''
      }
    })
    callback(products)
  }, (error) => {
    console.error('[Firebase] Products snapshot ERROR:', error)
    console.error('[Firebase] This usually means Firestore Security Rules are blocking read access.')
    console.error('[Firebase] Go to Firebase Console → Firestore → Rules and set: allow read: if true;')
    if (onError) onError(error)
  })
}

export function subscribeToCategories(callback: (categories: Category[]) => void, onError?: (err: unknown) => void) {
  console.log('[Firebase] Subscribing to categories collection...')
  const categoriesRef = collection(db, 'categories')
  return onSnapshot(categoriesRef, (snapshot) => {
    console.log(`[Firebase] Categories snapshot received: ${snapshot.size} documents`)
    const categories: Category[] = snapshot.docs.map((doc) => {
      const data = doc.data()
      const rawId = data.id || doc.id
      const numId = typeof rawId === 'number' ? rawId : (parseInt(String(rawId), 10) || Math.abs(hashString(doc.id)))
      
      return {
        id: numId,
        name: data.name || '',
        icon: data.icon || 'package'
      }
    })
    callback(categories)
  }, (error) => {
    console.error('[Firebase] Categories snapshot ERROR:', error)
    console.error('[Firebase] This usually means Firestore Security Rules are blocking read access.')
    if (onError) onError(error)
  })
}

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash
}

// Send Order to Firestore
export async function sendOrderToFirestore(order: Order) {
  try {
    const ordersRef = collection(db, 'orders')
    // Remove undefined values
    const cleanOrder = JSON.parse(JSON.stringify(order))
    await addDoc(ordersRef, {
      ...cleanOrder,
      createdAt: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error writing order to Firestore:", error)
  }
}

// User Management
export async function saveUserToFirestore(user: { id: number; first_name: string; last_name?: string; username?: string; photo_url?: string }) {
  try {
    const usersRef = collection(db, 'users')
    await setDoc(doc(usersRef, String(user.id)), {
      ...user,
      lastActive: new Date().toISOString()
    }, { merge: true })
  } catch (error) {
    console.error("Error saving user to Firestore:", error)
  }
}

export function subscribeToUserProfile(userId: number, callback: (profile: any) => void) {
  const userRef = doc(db, 'users', String(userId))
  
  return onSnapshot(userRef, (snapshot: any) => {
    if (snapshot.exists()) {
      callback(snapshot.data())
    } else {
      callback(null)
    }
  }, (error: any) => {
    console.error("Error fetching user profile:", error)
  })
}

export async function updateUserProfile(userId: number, data: any) {
  try {
    const userRef = doc(db, 'users', String(userId))
    await updateDoc(userRef, data)
  } catch (error) {
    console.error("Error updating user profile:", error)
  }
}

// Subscribe to User Orders
export function subscribeToUserOrders(userId: number, callback: (orders: Order[]) => void) {
  const ordersRef = collection(db, 'orders')
  // We only use 'where' to avoid requiring a composite index in Firestore.
  // Sorting will be done on the client side.
  const q = query(ordersRef, where('userId', '==', userId))
  
  return onSnapshot(q, (snapshot: any) => {
    let orders = snapshot.docs.map((doc: any) => ({
      ...doc.data()
    })) as Order[]
    
    // Sort by createdAt descending
    orders.sort((a, b) => {
      const dateA = (a as any).createdAt || ''
      const dateB = (b as any).createdAt || ''
      return dateB.localeCompare(dateA)
    })
    
    callback(orders)
  }, (error: any) => {
    console.error("Error fetching user orders:", error)
  })
}

// ── REVIEWS ──────────────────────────────────────────────────
import type { Review } from '../types/domain'

export async function addReview(review: Omit<Review, 'id'>) {
  try {
    const reviewsRef = collection(db, 'reviews')
    await addDoc(reviewsRef, review)
  } catch (error) {
    console.error("Error adding review:", error)
    throw error
  }
}

export function subscribeToProductReviews(productId: number, callback: (reviews: Review[]) => void) {
  const reviewsRef = collection(db, 'reviews')
  const q = query(reviewsRef, where('productId', '==', productId))
  
  return onSnapshot(q, (snapshot) => {
    const reviews: Review[] = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as Review))
    // sort by newest
    reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    callback(reviews)
  }, (error) => {
    console.error("Error fetching product reviews:", error)
  })
}

export function subscribeToUserReviews(userId: number, callback: (reviews: Review[]) => void) {
  const reviewsRef = collection(db, 'reviews')
  const q = query(reviewsRef, where('userId', '==', userId))
  
  return onSnapshot(q, (snapshot) => {
    const reviews: Review[] = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as Review))
    // sort by newest
    reviews.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    callback(reviews)
  }, (error) => {
  }, (error) => {
    console.error("Error fetching user reviews:", error)
  })
}

// ==========================================
// NOTIFICATIONS
// ==========================================

export function subscribeToUserNotifications(userId: number, callback: (notifications: any[]) => void) {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId)
  )
  return onSnapshot(q, (snapshot) => {
    const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    // Sort in memory by date desc (if real string dates)
    notifs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    callback(notifs)
  })
}

export async function markNotificationsAsRead(userId: number) {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    )
    const snapshot = await getDocs(q)
    const batch = writeBatch(db)
    snapshot.docs.forEach(docSnap => {
      batch.update(docSnap.ref, { read: true })
    })
    await batch.commit()
  } catch (e) {
    console.error('Error marking notifications as read', e)
  }
}
