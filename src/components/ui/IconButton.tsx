import type { ReactNode } from 'react'

type Props = { children: ReactNode; label: string; onClick?: () => void }
export function IconButton({ children, label, onClick }: Props) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className="grid size-11 place-items-center rounded-2xl transition hover:bg-violet-50 active:scale-90"
      style={{ color: '#111426' }}
    >
      {children}
    </button>
  )
}
