import { useState } from 'react'
import { ArrowLeft, Heart, Minus, Plus, ShoppingCart, Star, Truck } from 'lucide-react'
import { formatPrice } from '../data'
import { getImageUrl } from '../utils/telegram'
import { CartButton } from '../components/ui/CartButton'
import type { Product } from '../types/domain'

type Props = {
  product: Product
  onAddToCart: (product: Product, size?: string, color?: string) => void
  onBack: () => void
  likedIds: number[]
  onToggleLike: (id: number) => void
  onOpenCart: () => void
  cartCount: number
}

export function ProductDetailPage({ product, onAddToCart, onBack, likedIds, onToggleLike, onOpenCart, cartCount }: Props) {
  const [activeImage, setActiveImage] = useState(0)
  const [count, setCount] = useState(1)
  const colorsList = product.colors || (product.color ? product.color.split(',').map(c => c.trim()).filter(Boolean) : [])
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '')
  const [selectedColor, setSelectedColor] = useState(colorsList[0] || '')
  const favourite = likedIds.includes(product.id)
  const images = product.images || []

  const handleAddToCart = () => {
    for (let i = 0; i < count; i++) onAddToCart(product, selectedSize, selectedColor)
    setCount(1)
  }

  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-8 sm:px-10">
        <button onClick={onBack} className="grid size-11 place-items-center rounded-2xl transition hover:bg-violet-50 active:scale-90" style={{ color: '#111426' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-bold" style={{ color: '#111426' }}>Mahsulot</h2>
        <div className="flex gap-1">
          <button onClick={() => onToggleLike(product.id)} className="grid size-11 place-items-center rounded-2xl transition hover:bg-violet-50 active:scale-90" style={{ color: favourite ? '#6c20f5' : '#111426' }}>
            <Heart size={22} fill={favourite ? '#6c20f5' : 'none'} />
          </button>
          <CartButton count={cartCount} onClick={onOpenCart} />
        </div>
      </header>

      {/* Image */}
      <section className="relative mx-auto mt-3 max-w-3xl px-5" style={{ animation: 'fadeInUp 0.5s ease' }}>
        {product.discount && (
          <span className="absolute left-8 top-7 z-10 rounded-lg px-2.5 py-1 text-xs font-bold shadow-md" style={{ background: '#f43f5e', color: '#fff' }}>
            {product.discount}
          </span>
        )}
        {images[activeImage] ? (
          <img className="mx-auto h-[280px] w-full object-contain sm:h-[400px]" src={getImageUrl(images[activeImage])} alt={product.name} />
        ) : (
          <div className="mx-auto grid h-[280px] w-full place-items-center sm:h-[400px]" style={{ color: '#cbd5e1' }}>
            <ShoppingCart size={60} />
          </div>
        )}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2">
            {images.map((_, i) => (
              <button key={i} onClick={() => setActiveImage(i)} className={'dot ' + (activeImage === i ? 'active' : '')} />
            ))}
          </div>
        )}
      </section>

      {/* Info */}
      <section className="mx-5 mt-5 rounded-t-[28px] border-t border-slate-100 pb-40 pt-7 sm:mx-10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-bold" style={{ color: '#7c3aed' }}>
            {product.category}
            <span className="ml-1 inline-grid size-4 place-items-center rounded-full text-[9px]" style={{ background: '#2563eb', color: '#fff' }}>✓</span>
          </span>
          <span className="flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold" style={{ background: '#f5f0ff', color: '#6d28d9' }}>
            <Truck size={18} /> Tez yetkazib berish
          </span>
        </div>

        <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl" style={{ color: '#111426' }}>{product.name}</h1>

        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm" style={{ color: '#64748b' }}>
          <Star size={19} fill="#ffb000" style={{ color: '#fbbf24' }} />
          {product.rating.toFixed(1)} ({product.reviews} ta baho)
        </p>

        <div className="mt-6 flex items-baseline gap-3">
          <strong className="text-3xl" style={{ color: '#111426' }}>{formatPrice(product.price)}</strong>
          {product.oldPrice && <del style={{ color: '#94a3b8' }}>{formatPrice(product.oldPrice)}</del>}
        </div>

        {/* Colors */}
        {colorsList.length > 0 && (
          <section className="detail-panel">
            <b style={{ color: '#111426' }}>Rangni tanlang</b>
            <div className="mt-4 flex flex-wrap gap-3">
              {colorsList.map((c) => (
                <button 
                  onClick={() => setSelectedColor(c)} 
                  className={'size-chip ' + (selectedColor === c ? 'active' : '')} 
                  key={c}
                >
                  <b>{c}</b>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Sizes */}
        {product.sizes && product.sizes.length > 0 && (
          <section className="detail-panel">
            <b style={{ color: '#111426' }}>Razmerni tanlang</b>
            <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-7">
              {product.sizes.map((s) => (
                <button onClick={() => setSelectedSize(s)} className={'size-chip ' + (selectedSize === s ? 'active' : '')} key={s}>
                  <b>{s}</b>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Description */}
        {product.description && (
          <section className="detail-panel">
            <b style={{ color: '#111426' }}>Mahsulot haqida</b>
            <p className="mt-4 text-sm leading-7" style={{ color: '#64748b' }}>{product.description}</p>
          </section>
        )}
      </section>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t p-4" style={{ borderColor: '#f1f5f9', background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)' }}>
        <div className="mx-auto flex max-w-[1120px] items-center gap-3 sm:gap-4">
          <div className="hidden sm:block">
            <b className="text-xl" style={{ color: '#111426' }}>{formatPrice(product.price)}</b>
          </div>
          <div className="flex items-center gap-2 rounded-2xl p-1.5 sm:gap-3 sm:p-2" style={{ background: '#f8fafc' }}>
            <button onClick={() => setCount(Math.max(1, count - 1))} className="grid size-8 place-items-center rounded-lg transition hover:bg-white active:scale-90" style={{ color: '#111426' }}>
              <Minus size={18} />
            </button>
            <b className="w-5 text-center" style={{ color: '#111426' }}>{count}</b>
            <button onClick={() => setCount(count + 1)} className="grid size-8 place-items-center rounded-lg transition hover:bg-white active:scale-90" style={{ color: '#111426' }}>
              <Plus size={18} />
            </button>
          </div>
          <button
            onClick={handleAddToCart}
            className="ml-auto flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 font-bold shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] sm:gap-3 sm:py-4"
            style={{ background: 'linear-gradient(135deg, #6d28d9, #7c3aed)', color: '#fff', boxShadow: '0 8px 24px rgba(109, 40, 217, 0.25)' }}
          >
            <ShoppingCart size={20} />
            <span className="text-sm sm:text-base">Savatchaga qo'shish</span>
          </button>
        </div>
      </div>
    </>
  )
}
