import { useState } from 'react'
import { ArrowLeft, Copy, Check, MapPin, MessageSquare, Phone, Send, ShoppingBag, User, Navigation, CreditCard, Banknote } from 'lucide-react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { formatPrice } from '../data'
import { getImageUrl, hapticFeedback } from '../utils/telegram'
import type { OrderForm, Product } from '../types/domain'
import L from 'leaflet'

// Fix Leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

type Props = {
  cartProducts: { product: Product; quantity: number }[]
  cartTotal: number
  orderForm: OrderForm
  onUpdateForm: (field: keyof OrderForm, value: any) => void
  onSubmit: () => Promise<boolean>
  onBack: () => void
}

function LocationPicker({ location, onChange }: { location: { lat: number; lng: number } | null, onChange: (loc: { lat: number; lng: number }) => void }) {
  const [mapCenter] = useState<{ lat: number; lng: number }>(location || { lat: 41.2995, lng: 69.2401 }) // Default: Tashkent

  const MapEvents = () => {
    useMapEvents({
      click(e) {
        onChange(e.latlng)
        hapticFeedback('light')
      },
    })
    return null
  }

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          hapticFeedback('medium')
        },
        () => alert("Lokatsiyani aniqlab bo'lmadi")
      )
    }
  }

  return (
    <div className="relative mt-2 h-[240px] w-full overflow-hidden rounded-2xl border" style={{ borderColor: '#e2e8f0' }}>
      <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%', zIndex: 1 }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {location && <Marker position={location} />}
        <MapEvents />
      </MapContainer>
      
      <button 
        type="button"
        onClick={handleCurrentLocation}
        className="absolute bottom-4 right-4 z-[400] grid size-10 place-items-center rounded-xl bg-white shadow-md transition hover:scale-105 active:scale-95"
        style={{ color: '#7c3aed' }}
      >
        <Navigation size={20} />
      </button>
    </div>
  )
}

export function CheckoutPage({ cartProducts, cartTotal, orderForm, onUpdateForm, onSubmit, onBack }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleSubmit = async () => {
    await onSubmit()
  }

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
          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-bold" style={{ color: '#334155' }}>
                Ismingiz <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div className="flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all focus-within:border-violet-300 focus-within:shadow-md focus-within:shadow-violet-100" style={{ borderColor: '#e2e8f0', background: '#fafafa' }}>
                <User size={20} style={{ color: '#94a3b8' }} className="shrink-0" />
                <input
                  value={orderForm.name}
                  onChange={(e) => onUpdateForm('name', e.target.value)}
                  placeholder="To'liq ismingizni kiriting"
                  className="h-6 w-full bg-transparent text-sm outline-none"
                  style={{ color: '#111426' }}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 block text-sm font-bold" style={{ color: '#334155' }}>
                Telefon raqam <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div className="flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all focus-within:border-violet-300 focus-within:shadow-md focus-within:shadow-violet-100" style={{ borderColor: '#e2e8f0', background: '#fafafa' }}>
                <Phone size={20} style={{ color: '#94a3b8' }} className="shrink-0" />
                <input
                  value={orderForm.phone}
                  onChange={(e) => onUpdateForm('phone', e.target.value)}
                  placeholder="+998 90 123 45 67"
                  type="tel"
                  className="h-6 w-full bg-transparent text-sm outline-none"
                  style={{ color: '#111426' }}
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="mb-1.5 block text-sm font-bold" style={{ color: '#334155' }}>
                Manzil <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div className="flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all focus-within:border-violet-300 focus-within:shadow-md focus-within:shadow-violet-100" style={{ borderColor: '#e2e8f0', background: '#fafafa' }}>
                <MapPin size={20} style={{ color: '#94a3b8' }} className="shrink-0" />
                <input
                  value={orderForm.address}
                  onChange={(e) => onUpdateForm('address', e.target.value)}
                  placeholder="Toshkent shahar, Yunusobod tumani..."
                  className="h-6 w-full bg-transparent text-sm outline-none"
                  style={{ color: '#111426' }}
                />
              </div>
            </div>

            {/* Map Location */}
            <div>
              <label className="mb-1.5 block text-sm font-bold" style={{ color: '#334155' }}>
                Xaritadan tanlash (ixtiyoriy)
              </label>
              <p className="text-xs mb-2" style={{ color: '#64748b' }}>Yetkazib berishni osonlashtirish uchun xaritadan joyni belgilang</p>
              <LocationPicker 
                location={orderForm.location || null} 
                onChange={(loc) => onUpdateForm('location', loc)} 
              />
            </div>

            {/* Comment */}
            <div>
              <label className="mb-1.5 block text-sm font-bold" style={{ color: '#334155' }}>
                Izoh (ixtiyoriy)
              </label>
              <div className="flex items-start gap-3 rounded-2xl border px-4 py-3 transition-all focus-within:border-violet-300 focus-within:shadow-md focus-within:shadow-violet-100" style={{ borderColor: '#e2e8f0', background: '#fafafa' }}>
                <MessageSquare size={20} style={{ color: '#94a3b8' }} className="shrink-0 mt-0.5" />
                <textarea
                  value={orderForm.comment}
                  onChange={(e) => onUpdateForm('comment', e.target.value)}
                  placeholder="Qo'shimcha izoh..."
                  rows={3}
                  className="w-full resize-none bg-transparent text-sm outline-none"
                  style={{ color: '#111426' }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Payment Method ───────────────────────────── */}
        <section className="mt-6" style={{ animation: 'fadeInUp 0.4s ease 0.2s both' }}>
          <h3 className="mb-4 font-bold" style={{ color: '#111426' }}>To'lov usuli</h3>

          <div className="flex gap-3">
            {/* Naqd */}
            <button
              type="button"
              onClick={() => onUpdateForm('paymentMethod', 'Naqd')}
              className="flex flex-1 flex-col items-center gap-2 rounded-2xl border-2 py-4 transition-all"
              style={{
                borderColor: orderForm.paymentMethod === 'Naqd' ? '#7c3aed' : '#e2e8f0',
                background: orderForm.paymentMethod === 'Naqd' ? '#f5f0ff' : '#fafafa',
              }}
            >
              <Banknote size={26} style={{ color: orderForm.paymentMethod === 'Naqd' ? '#7c3aed' : '#94a3b8' }} />
              <span className="text-sm font-bold" style={{ color: orderForm.paymentMethod === 'Naqd' ? '#7c3aed' : '#64748b' }}>💵 Naqd pul</span>
              <span className="text-xs" style={{ color: '#94a3b8' }}>Yetkazganda</span>
            </button>

            {/* Karta */}
            <button
              type="button"
              onClick={() => onUpdateForm('paymentMethod', 'Karta')}
              className="flex flex-1 flex-col items-center gap-2 rounded-2xl border-2 py-4 transition-all"
              style={{
                borderColor: orderForm.paymentMethod === 'Karta' ? '#7c3aed' : '#e2e8f0',
                background: orderForm.paymentMethod === 'Karta' ? '#f5f0ff' : '#fafafa',
              }}
            >
              <CreditCard size={26} style={{ color: orderForm.paymentMethod === 'Karta' ? '#7c3aed' : '#94a3b8' }} />
              <span className="text-sm font-bold" style={{ color: orderForm.paymentMethod === 'Karta' ? '#7c3aed' : '#64748b' }}>💳 Karta</span>
              <span className="text-xs" style={{ color: '#94a3b8' }}>O'tkazma</span>
            </button>
          </div>

          {/* Karta tanlanganda yo'riqnoma */}
          {orderForm.paymentMethod === 'Karta' && (
            <div
              className="mt-4 rounded-2xl border-2 p-4"
              style={{ borderColor: '#7c3aed', background: '#f5f0ff', animation: 'fadeInUp 0.3s ease' }}
            >
              <p className="mb-3 text-sm font-bold" style={{ color: '#7c3aed' }}>💳 Karta ma'lumotlari:</p>

              <div className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
                <div>
                  <p className="text-xs" style={{ color: '#64748b' }}>Karta raqami</p>
                  <p className="font-mono text-sm font-bold" style={{ color: '#111426' }}>5614 6818 1872 7921</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('5614 6818 1872 7921')}
                  className="grid size-9 place-items-center rounded-xl transition active:scale-90"
                  style={{ background: copied ? '#dcfce7' : '#f1f5f9', color: copied ? '#16a34a' : '#7c3aed' }}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                </button>
              </div>

              <div className="mt-3 flex items-start gap-2 rounded-xl p-3" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                <span className="text-base">📌</span>
                <p className="text-xs leading-relaxed" style={{ color: '#92400e' }}>
                  Formani to'ldirganingizdan so'ng, <b>bot orqali sizga xabar keladi.</b>{' '}
                  To'lov chekini (screenshot) botga yuboring.
                  Admin tekshirib, buyurtmangizni tasdiqlaydi.
                </p>
              </div>
            </div>
          )}
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
