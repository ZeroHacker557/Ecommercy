import { CheckCircle2, X } from 'lucide-react'

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="toast">
      <CheckCircle2 className="shrink-0" style={{ color: '#22c55e' }} />
      <p className="text-sm font-bold" style={{ color: '#111426' }}>{message}</p>
      <button
        onClick={onClose}
        className="ml-auto shrink-0 transition hover:opacity-70 active:scale-90"
        style={{ color: '#94a3b8' }}
      >
        <X size={18} />
      </button>
    </div>
  )
}
