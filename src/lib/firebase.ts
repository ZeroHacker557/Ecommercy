import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore'
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
    // We can use the user's ID as the document ID for easier retrieval
    const { doc, setDoc } = await import('firebase/firestore')
    await setDoc(doc(usersRef, String(user.id)), {
      ...user,
      lastActive: new Date().toISOString()
    }, { merge: true })
  } catch (error) {
    console.error("Error saving user to Firestore:", error)
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
