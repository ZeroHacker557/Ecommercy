import { ArrowLeft, Search } from 'lucide-react'
import type { Product } from '../../types/domain'

type Props = {
  query: string
  results: Product[]
  onQueryChange: (value: string) => void
  onClose: () => void
  onOpenProduct: (product: Product) => void
}

export function SearchOverlay({ query, results, onQueryChange, onClose, onOpenProduct }: Props) {
  return (
    <div className="search-overlay p-5 sm:p-10">
      <div className="mx-auto max-w-3xl">
        {/* Search Bar */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="grid size-12 shrink-0 place-items-center rounded-2xl transition hover:bg-violet-50 active:scale-90"
            style={{ background: '#f8fafc', color: '#111426' }}
          >
            <ArrowLeft />
          </button>
          <div className="flex flex-1 items-center gap-2 rounded-2xl px-4" style={{ background: '#f8fafc' }}>
            <Search className="shrink-0" style={{ color: '#94a3b8' }} />
            <input
              autoFocus
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Mahsulot qidiring..."
              className="h-12 w-full bg-transparent outline-none"
              style={{ color: '#111426' }}
            />
          </div>
        </div>

        {/* Results */}
        <h2 className="mt-8 text-xl font-extrabold" style={{ color: '#111426' }}>
          {query ? `"${query}" bo'yicha natijalar` : 'Qidiruv natijalari'}
        </h2>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {results.map((product, i) => (
            <button
              key={product.id}
              onClick={() => {
                onOpenProduct(product)
                onClose()
              }}
              className="flex items-center gap-3 rounded-2xl border p-3 text-left transition hover:shadow-sm active:scale-[0.98]"
              style={{ borderColor: '#f1f5f9', color: '#111426', animation: `fadeInUp 0.3s ease ${i * 0.05}s both` }}
            >
              <img className="size-16 rounded-xl object-contain" src={product.image} alt={product.name} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold" style={{ color: '#111426' }}>{product.name}</span>
                <small className="mt-1 block font-bold" style={{ color: '#7c3aed' }}>{product.price}</small>
              </span>
            </button>
          ))}
        </div>

        {query && !results.length && (
          <div className="py-16 text-center" style={{ color: '#94a3b8', animation: 'fadeInUp 0.4s ease' }}>
            <Search className="mx-auto mb-3" size={42} />
            <p className="font-bold" style={{ color: '#334155' }}>Hech narsa topilmadi</p>
            <p className="mt-1 text-sm">Boshqa kalit so'z bilan qidirib ko'ring.</p>
          </div>
        )}
      </div>
    </div>
  )
}
