import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { formatPrice } from '../../data'
import { getImageUrl } from '../../utils/telegram'
import type { Product } from '../../types/domain'

type Props = {
  cartProducts: { product: Product; quantity: number; size?: string; color?: string; cartKey: string }[]
  cartTotal: number
  onClose: () => void
  onUpdateQuantity: (cartKey: string, quantity: number) => void
  onCheckout: () => void
}

export function CartDrawer({ cartProducts, cartTotal, onClose, onUpdateQuantity, onCheckout }: Props) {
  return (
    <div
      className="cart-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Savatcha"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <aside className="cart-drawer">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-100 p-6">
          <div>
            <h2 className="text-2xl font-extrabold" style={{ color: '#111426' }}>Savatcha</h2>
            <p className="mt-1 text-sm" style={{ color: '#64748b' }}>{cartProducts.length} xil mahsulot</p>
          </div>
          <button onClick={onClose} className="grid size-11 place-items-center rounded-2xl transition hover:bg-violet-50 active:scale-90" style={{ background: '#f8fafc', color: '#111426' }}>
            <X />
          </button>
        </header>

        {cartProducts.length ? (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {cartProducts.map(({ product, quantity, size, color, cartKey }, i) => (
                <article
                  key={cartKey}
                  className="flex gap-3 rounded-2xl border border-slate-100 p-3 transition hover:border-violet-100 hover:shadow-sm"
                  style={{ animation: `fadeInUp 0.4s ease ${i * 0.06}s both` }}
                >
                  {product.images?.[0] ? (
                    <img src={getImageUrl(product.images[0])} alt={product.name} className="size-20 rounded-xl object-contain" />
                  ) : (
                    <div className="grid size-20 place-items-center rounded-xl" style={{ background: '#f8fafc', color: '#cbd5e1' }}>
                      <ShoppingBag size={24} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold" style={{ color: '#111426' }}>{product.name}</h3>
                    {(size || color) && (
                      <p className="mt-0.5 text-xs font-medium" style={{ color: '#64748b' }}>
                        {size && `O'lcham: ${size}`} {size && color && ' | '} {color && `Rang: ${color}`}
                      </p>
                    )}
                    <p className="mt-1 text-sm font-extrabold" style={{ color: '#111426' }}>{formatPrice(product.price)}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-xl p-1" style={{ background: '#f8fafc' }}>
                        <button onClick={() => onUpdateQuantity(cartKey, quantity - 1)} className="grid size-7 place-items-center rounded-lg transition hover:bg-white active:scale-90" style={{ color: '#111426' }}>
                          <Minus size={15} />
                        </button>
                        <b className="w-5 text-center text-sm" style={{ color: '#111426' }}>{quantity}</b>
                        <button onClick={() => onUpdateQuantity(cartKey, quantity + 1)} className="grid size-7 place-items-center rounded-lg transition hover:bg-white active:scale-90" style={{ color: '#111426' }}>
                          <Plus size={15} />
                        </button>
                      </div>
                      <button onClick={() => onUpdateQuantity(cartKey, 0)} className="grid size-8 place-items-center transition hover:scale-110 active:scale-90" style={{ color: '#94a3b8' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <footer className="border-t border-slate-100 p-5">
              <div className="mb-4 flex justify-between text-lg">
                <span className="font-bold" style={{ color: '#111426' }}>Jami</span>
                <b style={{ color: '#111426' }}>{formatPrice(cartTotal)}</b>
              </div>
              <button
                onClick={onCheckout}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #6d28d9, #7c3aed)', color: '#fff', boxShadow: '0 8px 24px rgba(109, 40, 217, 0.25)' }}
              >
                <ShoppingBag size={20} /> Buyurtma berish
              </button>
            </footer>
          </>
        ) : (
          <div className="grid flex-1 place-items-center p-8 text-center">
            <div style={{ animation: 'fadeInUp 0.5s ease' }}>
              <span className="mx-auto grid size-20 place-items-center rounded-full" style={{ background: '#f5f0ff', color: '#7c3aed' }}>
                <ShoppingBag size={36} />
              </span>
              <h3 className="mt-5 text-xl font-extrabold" style={{ color: '#111426' }}>Savatchangiz bo'sh</h3>
              <p className="mt-2 text-sm" style={{ color: '#64748b' }}>Yoqtirgan mahsulotlaringizni tanlang.</p>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
