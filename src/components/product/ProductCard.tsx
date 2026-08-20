import { Heart, ShoppingCart, Star } from 'lucide-react'
import { formatPrice } from '../../data'
import { getImageUrl } from '../../utils/telegram'
import type { Product, ProductActions } from '../../types/domain'

type Props = ProductActions & { product: Product; compact?: boolean }

export function ProductCard({ product, onOpen, onAddToCart, likedIds, onToggleLike, compact = false }: Props) {
  const favourite = likedIds.includes(product.id)
  const imgSrc = product.images?.[0] ? getImageUrl(product.images[0]) : ''

  return (
    <article className={'product-card group ' + (compact ? 'min-w-[174px] sm:min-w-[210px]' : '')}>
      {/* Like Button */}
      <button
        className="absolute right-3 top-3 z-10 grid size-9 place-items-center rounded-full shadow-sm transition hover:scale-110 active:scale-90"
        style={{ background: 'rgba(255,255,255,0.92)', color: favourite ? '#6c20f5' : '#111426' }}
        onClick={(e) => { e.stopPropagation(); onToggleLike(product.id) }}
        aria-label="Sevimliga qo'shish"
      >
        <Heart size={21} fill={favourite ? '#6c20f5' : 'none'} />
      </button>

      {/* Discount Badge */}
      {product.discount && (
        <span className="absolute left-3 top-3 z-10 rounded-lg px-2 py-1 text-xs font-bold shadow-md" style={{ background: '#f43f5e', color: '#fff' }}>
          {product.discount}
        </span>
      )}

      {/* Image */}
      <button className="block w-full text-left" onClick={() => onOpen(product)} style={{ color: '#111426' }}>
        {imgSrc ? (
          <img
            className={'w-full object-contain transition duration-500 group-hover:scale-105 ' + (compact ? 'h-36 p-3' : 'h-48 p-5 sm:h-56')}
            src={imgSrc}
            alt={product.name}
          />
        ) : (
          <div className={'grid w-full place-items-center ' + (compact ? 'h-36' : 'h-48 sm:h-56')} style={{ color: '#cbd5e1' }}>
            <ShoppingCart size={40} />
          </div>
        )}
        <div className="px-4 pb-3">
          <h3 className="line-clamp-2 text-sm font-bold sm:text-base" style={{ color: '#111426' }}>{product.name}</h3>
          {!compact && (
            <p className="mt-2 flex items-center gap-1 text-xs" style={{ color: '#64748b' }}>
              <Star size={15} fill="#ffb000" style={{ color: '#fbbf24' }} />
              {product.rating.toFixed(1)} ({product.reviews})
            </p>
          )}
        </div>
      </button>

      {/* Price & Add to Cart */}
      <div className="flex items-end justify-between gap-2 px-4 pb-4">
        <div>
          <p className="whitespace-nowrap text-sm font-extrabold sm:text-base" style={{ color: '#111426' }}>{formatPrice(product.price)}</p>
          {product.oldPrice && !compact && (
            <p className="mt-1 text-[11px] line-through" style={{ color: '#94a3b8' }}>{formatPrice(product.oldPrice)}</p>
          )}
        </div>
        <button
          className="add-button"
          onClick={(e) => { e.stopPropagation(); onAddToCart(product) }}
          aria-label="Savatchaga qo'shish"
        >
          <ShoppingCart size={20} />
        </button>
      </div>
    </article>
  )
}
