import { Heart } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { ProductCard } from '../components/product/ProductCard'
import type { Product, ProductActions } from '../types/domain'

type Props = ProductActions & {
  products: Product[]
  cartCount: number
  onOpenCart: () => void
}

export function FavoritesPage({ products, cartCount, likedIds, onOpenCart, ...actions }: Props) {
  const favorites = products.filter((p) => likedIds.includes(p.id))

  return (
    <>
      <PageHeader title="Sevimlilar" cartCount={cartCount} onCart={onOpenCart} />
      <section className="px-5 pb-32 pt-6 sm:px-10">
        <p style={{ color: '#64748b' }}>
          Jami <b style={{ color: '#7c3aed' }}>{favorites.length}</b> ta mahsulot
        </p>
        {favorites.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {favorites.map((product) => (
              <ProductCard key={product.id} product={product} likedIds={likedIds} {...actions} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-24 text-center" style={{ animation: 'fadeInUp 0.5s ease' }}>
            <span className="mx-auto grid size-20 place-items-center rounded-full" style={{ background: '#f5f0ff', color: '#a78bfa' }}>
              <Heart size={42} />
            </span>
            <p className="mt-5 text-lg font-bold" style={{ color: '#334155' }}>Sevimli mahsulotlar hali yo'q</p>
            <p className="mt-2 text-sm" style={{ color: '#94a3b8' }}>Yoqtirgan mahsulotlaringizni ❤️ tugmasini bosib qo'shing.</p>
          </div>
        )}
      </section>
    </>
  )
}
