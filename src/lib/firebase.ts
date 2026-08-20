import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, onSnapshot } from 'firebase/firestore'
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
export function subscribeToProducts(callback: (products: Product[]) => void, onError?: () => void) {
  const productsRef = collection(db, 'products')
  return onSnapshot(productsRef, (snapshot) => {
    const products: Product[] = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: data.id || doc.id,
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
    console.error("Firestore products snapshot error:", error)
    if (onError) onError()
  })
}

export function subscribeToCategories(callback: (categories: Category[]) => void, onError?: () => void) {
  const categoriesRef = collection(db, 'categories')
  return onSnapshot(categoriesRef, (snapshot) => {
    const categories: Category[] = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: data.id || doc.id,
        name: data.name || '',
        icon: data.icon || ''
      }
    })
    callback(categories)
  }, (error) => {
    console.error("Firestore categories snapshot error:", error)
    if (onError) onError()
  })
}

// Send Order to Firestore
export async function sendOrderToFirestore(order: Order) {
  try {
    const ordersRef = collection(db, 'orders')
    await addDoc(ordersRef, {
      ...order,
      createdAt: new Date().toISOString()
    })
  } catch (error) {
    console.error("Error writing order to Firestore:", error)
  }
}
