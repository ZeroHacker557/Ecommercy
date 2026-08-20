import { CheckCircle2, ShoppingBag } from 'lucide-react'

type Props = {
  onViewOrders: () => void
}

export function CheckoutSuccess({ onViewOrders }: Props) {
  return (
    <div className="checkout-success-overlay" onClick={onViewOrders}>
      <div className="checkout-success-card" onClick={(e) => e.stopPropagation()}>
        <span
          className="mx-auto grid size-20 place-items-center rounded-full"
          style={{ background: '#f0fdf4', color: '#22c55e', animation: 'bounceIn 0.6s ease' }}
        >
          <CheckCircle2 size={44} />
        </span>
        <h2 className="mt-6 text-2xl font-extrabold" style={{ color: '#111426' }}>Buyurtma berildi!</h2>
        <p className="mt-3 text-sm" style={{ color: '#64748b' }}>
          Sizning buyurtmangiz muvaffaqiyatli qabul qilindi. Tez orada siz bilan bog'lanamiz.
        </p>
        <button
          onClick={onViewOrders}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold shadow-lg transition hover:-translate-y-0.5 active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #6d28d9, #7c3aed)', color: '#fff', boxShadow: '0 8px 24px rgba(109, 40, 217, 0.25)' }}
        >
          <ShoppingBag size={20} />
          Buyurtmalarimni ko'rish
        </button>
      </div>
    </div>
  )
}
