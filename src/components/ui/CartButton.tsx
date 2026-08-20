import { ShoppingCart } from 'lucide-react'

export function CartButton({ count, onClick }: { count: number; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Savat"
      className="relative grid size-11 place-items-center rounded-2xl transition hover:bg-violet-50 active:scale-90"
      style={{ color: '#111426' }}
    >
      <ShoppingCart strokeWidth={2.25} />
      <span
        className="absolute right-0 top-0 grid size-5 place-items-center rounded-full text-[11px] font-bold"
        style={{ background: '#6c20f5', color: '#fff' }}
      >
        {count}
      </span>
    </button>
  )
}
