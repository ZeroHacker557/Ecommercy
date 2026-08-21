import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, ExternalLink, ShoppingBag, SlidersHorizontal } from 'lucide-react'
import { formatPrice } from '../data'
import { getImageUrl } from '../utils/telegram'
import { PageHeader } from '../components/layout/PageHeader'
import { OrderImages } from '../components/order/OrderImages'
import { openBotDeepLink } from '../utils/telegram'
import type { Order } from '../types/domain'

const BOT_USERNAME = 'ecommercy_test_bot'

const tabs = ['Barchasi', 'Yangi', 'Qabul qilindi', 'Bekor qilingan']

type Props = {
  orders: Order[]
  cartCount: number
  onSearch: () => void
  onOpenCart: () => void
}

export function OrdersPage({ orders, cartCount, onSearch, onOpenCart }: Props) {
  const [active, setActive] = useState('Barchasi')
  const [newest, setNewest] = useState(true)

  const filtered = useMemo(() => {
    if (active === 'Barchasi') return orders
    if (active === 'Bekor qilingan') return orders.filter((o) => o.status === 'Bekor qilingan')
    if (active === 'Yangi') return orders.filter((o) => o.status === 'Yangi')
    if (active === 'Qabul qilindi')
      return orders.filter(
        (o) => o.status === 'Qabul qilindi' || o.status === 'Yetkazilmoqda' || o.status === 'Yetkazildi'
      )
    return orders
  }, [active, orders])

  const shown = newest ? filtered : [...filtered].reverse()

  const getStatusColor = (status: string) => {
    if (status === 'Bekor qilingan' || status === 'Rad etildi') return '#ef4444'
    if (status === 'Yetkazilmoqda') return '#d97706'
    if (status === 'Yetkazildi') return '#16a34a'
    if (status === 'Qabul qilindi') return '#2563eb'
    return '#7c3aed'
  }

  /** Karta uchun to'lov holati badge va tugma */
  const getPayInfo = (order: Order) => {
    if (order.paymentMethod !== 'Karta') return null
    const s = order.paymentStatus
    if (s === 'Tolangan') return { label: '✅ To\'lov tasdiqlandi', color: '#16a34a', bg: '#dcfce7', needsAction: false }
    if (s === 'Rad etildi') return { label: '❌ Chek rad etildi', color: '#ef4444', bg: '#fee2e2', needsAction: true }
    return { label: '⏳ Chek kutilmoqda', color: '#d97706', bg: '#fef9c3', needsAction: true }
  }

  /** Botni ochib, FSM orqali chek so'rash */
  const handleSendReceipt = (orderId: string) => {
    // # belgisini olib tashlaymiz (URL xavfsizligi uchun)
    const safeId = orderId.replace('#', '')
    openBotDeepLink(BOT_USERNAME, `receipt_${safeId}`)
  }

  return (
    <>
      <PageHeader title="Buyurtmalarim" onSearch={onSearch} onCart={onOpenCart} cartCount={cartCount} />

      {/* Tabs */}
      <div className="mt-7 flex gap-7 overflow-x-auto border-b border-slate-100 px-5 sm:px-10 scrollbar-none">
        {tabs.map((label) => (
          <button
            onClick={() => setActive(label)}
            key={label}
            className={'tab whitespace-nowrap ' + (active === label ? 'active' : '')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <section className="flex items-center justify-end px-5 pt-6 sm:px-10">
        <button onClick={() => setNewest((v) => !v)} className="filter-button">
          <SlidersHorizontal size={19} />
          <span>{newest ? 'Eng yangi' : 'Eng eski'}</span>
          <ChevronDown size={18} className={`transition-transform duration-300 ${!newest ? 'rotate-180' : ''}`} />
        </button>
      </section>

      {/* Orders */}
      <section className="space-y-4 px-5 pb-32 pt-6 sm:px-10">
        {shown.map((order, i) => {
          const payInfo = getPayInfo(order)
          return (
            <div key={order.id} className="order-card flex-col gap-3" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="flex flex-col gap-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-extrabold truncate text-base" style={{ color: '#111426' }}>
                      {order.products.map(p => p.product.name).join(', ')}
                    </h3>
                    <p className="mt-1 text-xs font-bold" style={{ color: '#64748b' }}>Buyurtma ID: {order.id}</p>
                    <p className="mt-0.5 text-xs" style={{ color: '#94a3b8' }}>{order.date}</p>
                  </div>

                  <div className="flex flex-col items-end text-right shrink-0">
                    <p className="text-lg font-extrabold sm:text-xl" style={{ color: '#111426' }}>
                      {formatPrice(order.total)}
                    </p>
                    <p className="mt-1 text-sm font-semibold" style={{ color: getStatusColor(order.status) }}>
                      {order.status}
                    </p>
                    {payInfo && !payInfo.needsAction && (
                      <span
                        className="mt-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{ background: payInfo.bg, color: payInfo.color }}
                      >
                        {payInfo.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Products List */}
                <div className="mt-2 space-y-2 border-t border-slate-100 pt-3">
                  {order.products.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <img
                        src={item.product.images?.[0] ? getImageUrl(item.product.images[0]) : ''}
                        alt={item.product.name}
                        className="size-12 rounded-lg border border-slate-100 object-contain p-1"
                      />
                      <div className="text-sm min-w-0">
                        <p className="font-bold truncate" style={{ color: '#111426' }}>{item.product.name}</p>
                        <p className="text-[11px] font-medium" style={{ color: '#64748b' }}>
                          {item.quantity} ta
                          {item.size && ` | O'lcham: ${item.size}`}
                          {item.color && ` | Rang: ${item.color}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chek yuborish tugmasi — faqat Karta + to'lanmagan */}
              {payInfo?.needsAction && (
                <button
                  onClick={() => handleSendReceipt(order.id)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold transition active:scale-95"
                  style={{
                    background: payInfo.color === '#ef4444' ? '#fee2e2' : '#fef9c3',
                    color: payInfo.color,
                    border: `1.5px solid ${payInfo.color}30`,
                  }}
                >
                  <ExternalLink size={15} />
                  {payInfo.color === '#ef4444' ? '💳 Qayta chek yuborish' : '💳 To\'lov chekini yuborish'}
                </button>
              )}
            </div>
          )
        })}

        {!shown.length && (
          <div className="flex flex-col items-center py-20 text-center" style={{ animation: 'fadeInUp 0.5s ease' }}>
            <span className="grid size-20 place-items-center rounded-full" style={{ background: '#f5f0ff', color: '#a78bfa' }}>
              <ShoppingBag size={36} />
            </span>
            <p className="mt-5 text-lg font-bold" style={{ color: '#334155' }}>
              {orders.length === 0 ? "Buyurtmalar hali yo'q" : "Bu bo'limda buyurtma topilmadi"}
            </p>
            <p className="mt-2 text-sm" style={{ color: '#94a3b8' }}>
              {orders.length === 0 ? 'Birinchi buyurtmangizni bering!' : "Boshqa bo'limni tanlang."}
            </p>
          </div>
        )}
      </section>
    </>
  )
}
