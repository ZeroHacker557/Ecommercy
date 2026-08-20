import { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Package, ShoppingBag, SlidersHorizontal } from 'lucide-react'
import { formatPrice } from '../data'
import { PageHeader } from '../components/layout/PageHeader'
import { OrderImages } from '../components/order/OrderImages'
import type { Order } from '../types/domain'

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
    if (active === 'Qabul qilindi') return orders.filter((o) => o.status === 'Qabul qilindi' || o.status === 'Yetkazilmoqda' || o.status === 'Yetkazildi')
    return orders
  }, [active, orders])

  const shown = newest ? filtered : [...filtered].reverse()

  const getStatusColor = (status: string) => {
    if (status === 'Bekor qilingan' || status === 'Rad etildi') return '#ef4444'
    if (status === 'Yetkazilmoqda') return '#d97706'
    if (status === 'Yetkazildi') return '#16a34a'
    if (status === 'Qabul qilindi') return '#2563eb'
    return '#7c3aed' // Yangi
  }

  return (
    <>
      <PageHeader title="Buyurtmalarim" onSearch={onSearch} onCart={onOpenCart} cartCount={cartCount} />

      <div className="mt-7 flex gap-7 overflow-x-auto border-b border-slate-100 px-5 sm:px-10 scrollbar-none">
        {tabs.map((label) => (
          <button onClick={() => setActive(label)} key={label} className={'tab whitespace-nowrap ' + (active === label ? 'active' : '')}>
            {label}
          </button>
        ))}
      </div>

      <section className="flex items-center justify-end px-5 pt-6 sm:px-10">
        <button onClick={() => setNewest((v) => !v)} className="filter-button">
          <SlidersHorizontal size={19} />
          <span>{newest ? 'Eng yangi' : 'Eng eski'}</span>
          <ChevronDown size={18} className={`transition-transform duration-300 ${!newest ? 'rotate-180' : ''}`} />
        </button>
      </section>

      <section className="space-y-4 px-5 pb-32 pt-6 sm:px-10">
        {shown.map((order, i) => (
          <div key={order.id} className="order-card" style={{ animationDelay: `${i * 0.08}s` }}>
            <div>
              <h3 className="font-extrabold" style={{ color: '#111426' }}>{order.id}</h3>
              <p className="mt-1 text-sm" style={{ color: '#64748b' }}>{order.date}</p>
              <div className="mt-3">
                <OrderImages products={order.products} />
                <p className="mt-2 text-sm" style={{ color: '#64748b' }}>{order.products.length} ta mahsulot</p>
              </div>
            </div>
            <div className="flex flex-col items-end justify-between text-right">
              <p className="text-lg font-extrabold sm:text-xl" style={{ color: '#111426' }}>{formatPrice(order.total)}</p>
              <p className="mt-1 text-sm font-semibold" style={{ color: getStatusColor(order.status) }}>{order.status}</p>
              <ChevronRight className="mt-auto" style={{ color: '#7c3aed' }} />
            </div>
          </div>
        ))}
        {!shown.length && (
          <div className="flex flex-col items-center py-20 text-center" style={{ animation: 'fadeInUp 0.5s ease' }}>
            <span className="grid size-20 place-items-center rounded-full" style={{ background: '#f5f0ff', color: '#a78bfa' }}>
              <ShoppingBag size={36} />
            </span>
            <p className="mt-5 text-lg font-bold" style={{ color: '#334155' }}>
              {orders.length === 0 ? 'Buyurtmalar hali yo\'q' : 'Bu bo\'limda buyurtma topilmadi'}
            </p>
            <p className="mt-2 text-sm" style={{ color: '#94a3b8' }}>
              {orders.length === 0 ? 'Birinchi buyurtmangizni bering!' : 'Boshqa bo\'limni tanlang.'}
            </p>
          </div>
        )}
      </section>
    </>
  )
}
