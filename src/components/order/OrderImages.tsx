import { getImageUrl } from '../../utils/telegram'
import { ShoppingBag } from 'lucide-react'
import type { Product } from '../../types/domain'

export function OrderImages({ products }: { products: { product: Product; quantity: number }[] }) {
  return (
    <div className="flex gap-2">
      {products.slice(0, 3).map(({ product }) => (
        <div key={product.id} className="grid size-14 place-items-center rounded-xl border border-slate-100 bg-white sm:size-16">
          {product.images?.[0] ? (
            <img className="size-full rounded-xl object-contain p-1" src={getImageUrl(product.images[0])} alt={product.name} />
          ) : (
            <ShoppingBag size={18} style={{ color: '#cbd5e1' }} />
          )}
        </div>
      ))}
      {products.length > 3 && (
        <div className="grid size-14 place-items-center rounded-xl border border-slate-100 text-xs font-bold sm:size-16" style={{ color: '#64748b' }}>
          +{products.length - 3}
        </div>
      )}
    </div>
  )
}
