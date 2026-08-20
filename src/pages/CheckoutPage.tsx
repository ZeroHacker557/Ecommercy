import { ArrowLeft, MapPin, MessageSquare, Phone, Send, ShoppingBag, User } from 'lucide-react'
import { formatPrice } from '../data'
import { getImageUrl } from '../utils/telegram'
import type { OrderForm, Product } from '../types/domain'

type Props = {
  cartProducts: { product: Product; quantity: number }[]
  cartTotal: number
  orderForm: OrderForm
  onUpdateForm: (field: keyof OrderForm, value: string) => void
  onSubmit: () => Promise<boolean>
  onBack: () => void
}

export function CheckoutPage({ cartProducts, cartTotal, orderForm, onUpdateForm, onSubmit, onBack }: Props) {
  const handleSubmit = async () => {
    const success = await onSubmit()
    // Navigation handled by store
  }

  const fields: { key: keyof OrderForm; label: string; icon: typeof User; placeholder: string; type?: string; required?: boolean }[] = [
    { key: 'name', label: 'Ismingiz', icon: User, placeholder: 'To\'liq ismingizni kiriting', required: true },
    { key: 'phone', label: 'Telefon raqam', icon: Phone, placeholder: '+998 90 123 45 67', type: 'tel', required: true },
    { key: 'address', label: 'Manzil', icon: MapPin, placeholder: 'Yetkazib berish manzilingiz', required: true },
    { key: 'location', label: 'Lokatsiya (ixtiyoriy)', icon: MapPin, placeholder: 'Mo\'ljal yoki qo\'shimcha ma\'lumot' },
    { key: 'comment', label: 'Izoh (ixtiyoriy)', icon: MessageSquare, placeholder: 'Qo\'shimcha izoh...' },
  ]

  const isValid = orderForm.name.trim() && orderForm.phone.trim() && orderForm.address.trim()

  return (
    <>
      {/* Header */}
      <header className="flex items-center gap-3 px-5 pt-8 sm:px-10">
        <button
          onClick={onBack}
          className="grid size-11 place-items-center rounded-2xl transition hover:bg-violet-50 active:scale-90"
          style={{ color: '#111426' }}
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-extrabold" style={{ color: '#111426' }}>Buyurtma berish</h1>
      </header>

      <div className="px-5 pb-10 pt-6 sm:px-10">
        {/* Order Summary */}
        <section
          className="rounded-2xl border p-4"
          style={{ borderColor: '#f1f5f9', animation: 'fadeInUp 0.4s ease' }}
        >
          <h3 className="font-bold" style={{ color: '#111426' }}>
            <ShoppingBag size={18} className="mr-2 inline" style={{ color: '#7c3aed' }} />
            Buyurtma ({cartProducts.length} ta mahsulot)
          </h3>
          <div className="mt-3 space-y-3">
            {cartProducts.map(({ product, quantity }) => (
              <div key={product.id} className="flex items-center gap-3">
                <img
                  src={product.images[0] ? getImageUrl(product.images[0]) : ''}
                  alt={product.name}
                  className="size-14 rounded-xl border border-slate-100 object-contain p-1"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold" style={{ color: '#111426' }}>{product.name}</p>
                  <p className="text-xs" style={{ color: '#64748b' }}>{quantity} × {formatPrice(product.price)}</p>
                </div>
                <b className="text-sm" style={{ color: '#111426' }}>{formatPrice(product.price * quantity)}</b>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between border-t pt-3" style={{ borderColor: '#f1f5f9' }}>
            <span className="font-bold" style={{ color: '#111426' }}>Jami:</span>
            <b className="text-lg" style={{ color: '#7c3aed' }}>{formatPrice(cartTotal)}</b>
          </div>
        </section>

        {/* Order Form */}
        <section className="mt-6" style={{ animation: 'fadeInUp 0.4s ease 0.1s both' }}>
          <h3 className="mb-4 font-bold" style={{ color: '#111426' }}>Yetkazib berish ma'lumotlari</h3>
          <div className="space-y-4">
            {fields.map(({ key, label, icon: Icon, placeholder, type, required }) => (
              <div key={key}>
                <label className="mb-1.5 block text-sm font-bold" style={{ color: '#334155' }}>
                  {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
                <div className="flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all focus-within:border-violet-300 focus-within:shadow-md focus-within:shadow-violet-100"
                  style={{ borderColor: '#e2e8f0', background: '#fafafa' }}
                >
                  <Icon size={20} style={{ color: '#94a3b8' }} className="shrink-0" />
                  {key === 'comment' ? (
                    <textarea
                      value={orderForm[key]}
                      onChange={(e) => onUpdateForm(key, e.target.value)}
                      placeholder={placeholder}
                      rows={3}
                      className="w-full resize-none bg-transparent text-sm outline-none"
                      style={{ color: '#111426' }}
                    />
                  ) : (
                    <input
                      value={orderForm[key]}
                      onChange={(e) => onUpdateForm(key, e.target.value)}
                      placeholder={placeholder}
                      type={type || 'text'}
                      className="h-6 w-full bg-transparent text-sm outline-none"
                      style={{ color: '#111426' }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold shadow-lg transition hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0"
          style={{
            background: isValid ? 'linear-gradient(135deg, #6d28d9, #7c3aed)' : '#d1d5db',
            color: '#fff',
            boxShadow: isValid ? '0 8px 24px rgba(109, 40, 217, 0.25)' : 'none',
          }}
        >
          <Send size={20} />
          Buyurtma berish
        </button>

        <p className="mt-3 text-center text-xs" style={{ color: '#94a3b8' }}>
          Buyurtma berish tugmasini bosganingizda, sizning ma'lumotlaringiz sotuvchiga yuboriladi.
        </p>
      </div>
    </>
  )
}
