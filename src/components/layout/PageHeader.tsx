import { Search } from 'lucide-react'
import { CartButton } from '../ui/CartButton'
import { IconButton } from '../ui/IconButton'

type Props = {
  title: string
  onSearch?: () => void
  cartCount: number
  onCart?: () => void
}

export function PageHeader({ title, onSearch, cartCount, onCart }: Props) {
  return (
    <header className="flex items-center justify-between px-5 pt-8 sm:px-10">
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: '#111426' }}>{title}</h1>
      <div className="flex items-center gap-1">
        {onSearch && (
          <IconButton label="Qidirish" onClick={onSearch}>
            <Search />
          </IconButton>
        )}
        <CartButton count={cartCount} onClick={onCart} />
      </div>
    </header>
  )
}
