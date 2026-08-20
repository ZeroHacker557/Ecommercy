import type { LucideIcon } from 'lucide-react'
import { Grid2X2, Heart, Home, ShoppingBag, UserRound } from 'lucide-react'
import type { AppPage } from '../../types/domain'

const items: { id: Exclude<AppPage, 'detail'>; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Bosh sahifa', icon: Home },
  { id: 'catalog', label: 'Katalog', icon: Grid2X2 },
  { id: 'favorites', label: 'Sevimlilar', icon: Heart },
  { id: 'orders', label: 'Buyurtmalar', icon: ShoppingBag },
  { id: 'profile', label: 'Profil', icon: UserRound },
]

type Props = {
  page: AppPage
  onNavigate: (page: AppPage) => void
  cartCount: number
}

export function BottomNav({ page, onNavigate, cartCount }: Props) {
  return (
    <nav className="bottom-nav">
      {items.map(({ id, label, icon: Icon }) => (
        <button
          onClick={() => onNavigate(id)}
          key={id}
          className={'nav-item ' + (page === id ? 'active' : '')}
        >
          <span className="relative">
            <Icon size={24} fill={page === id ? 'currentColor' : 'none'} />
            {id === 'orders' && cartCount > 0 && (
              <span
                className="absolute -right-2 -top-1 grid size-4 place-items-center rounded-full text-[9px] font-bold"
                style={{ background: '#7c3aed', color: '#fff' }}
              >
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </span>
          <span className="text-center">{label}</span>
        </button>
      ))}
    </nav>
  )
}
