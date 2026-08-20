import type { Category, Product } from './types/domain'

// Bo'sh — mahsulotlar bot orqali qo'shiladi
export const products: Product[] = []

export const categories: Category[] = []

// Narxni formatlash
export function formatPrice(amount: number): string {
  return `${amount.toLocaleString('uz-UZ').replace(/,/g, ' ')} so'm`
}

// Narxni raqamga aylantirish (eski format uchun)
export function parsePrice(priceStr: string): number {
  return Number(priceStr.replace(/[^0-9]/g, ''))
}
