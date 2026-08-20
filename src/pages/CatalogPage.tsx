import { useMemo, useState } from 'react'
import { Box, ChevronDown, Gem, Grid2X2, Laptop, Loader2, Package, Shirt, ShoppingBag, SlidersHorizontal, X } from 'lucide-react'
import { PageHeader } from '../components/layout/PageHeader'
import { ProductCard } from '../components/product/ProductCard'
import type { Category, Product, ProductActions } from '../types/domain'

const defaultCategoryIcons = [
  { label: 'Barchasi', icon: Grid2X2 },
  { label: 'Elektronika', icon: Laptop },
  { label: 'Kiyim', icon: Shirt },
  { label: 'Poyabzal', icon: Box },
  { label: 'Sumkalar', icon: ShoppingBag },
  { label: 'Parfyumeriya', icon: Gem },
]

type Props = ProductActions & {
  products: Product[]
  categories: Category[]
  loading: boolean
  cartCount: number
  onSearch: () => void
  onOpenCart: () => void
}

export function CatalogPage({ products, categories, loading, cartCount, onSearch, onOpenCart, ...actions }: Props) {
  const [active, setActive] = useState('Barchasi')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [sortAscending, setSortAscending] = useState(true)

  // Use API categories if available, otherwise defaults
  const displayCategories = categories.length > 0
    ? [{ name: 'Barchasi' }, ...categories.map((c) => ({ name: c.name }))]
    : defaultCategoryIcons.map((c) => ({ name: c.label }))

  const getIcon = (name: string) => {
    const found = defaultCategoryIcons.find((c) => c.label === name)
    return found ? found.icon : Package
  }

  const shown = useMemo(() => {
    const filtered = active === 'Barchasi'
      ? products
      : products.filter((p) => p.category === active)
    return [...filtered].sort((a, b) =>
      sortAscending ? a.price - b.price : b.price - a.price,
    )
  }, [active, sortAscending, products])

  return (
    <>
      <PageHeader title="Katalog" onSearch={onSearch} onCart={onOpenCart} cartCount={cartCount} />

      {/* Categories */}
      <section className="mt-7 flex gap-3 overflow-x-auto px-5 pb-2 sm:px-10 scrollbar-none">
        {displayCategories.map(({ name }) => {
          const Icon = getIcon(name)
          return (
            <button
              onClick={() => setActive(name)}
              key={name}
              className={'catalog-category ' + (active === name ? 'active' : '')}
            >
              <Icon size={22} />
              <span>{name}</span>
            </button>
          )
        })}
      </section>

      {/* Filters */}
      <section className="flex items-center justify-between px-5 pt-6 sm:px-10">
        <button
          onClick={() => setFiltersOpen((o) => !o)}
          className="filter-button"
          style={filtersOpen ? { borderColor: '#c4b5fd', background: '#faf5ff' } : {}}
        >
          <SlidersHorizontal size={19} />
          <span>Filtrlar</span>
        </button>
        <button onClick={() => setSortAscending((v) => !v)} className="filter-button">
          <span>↕ {sortAscending ? 'Arzon narx' : 'Qimmat narx'}</span>
          <ChevronDown size={18} className={`transition-transform duration-300 ${!sortAscending ? 'rotate-180' : ''}`} />
        </button>
      </section>

      {filtersOpen && (
        <section className="mx-5 mt-4 rounded-2xl border p-4 sm:mx-10" style={{ borderColor: '#ddd6fe', background: '#faf5ff', animation: 'fadeInUp 0.3s ease' }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold" style={{ color: '#6d28d9' }}>
              Kategoriya: {active} • Narx: {sortAscending ? 'arzondan qimmatga' : 'qimmatdan arzonga'}
            </p>
            <button onClick={() => setFiltersOpen(false)} className="grid size-7 place-items-center rounded-lg" style={{ color: '#7c3aed' }}>
              <X size={16} />
            </button>
          </div>
        </section>
      )}

      {/* Products */}
      <section className="px-5 pb-32 pt-7 sm:px-10">
        <p style={{ color: '#64748b' }}>
          Jami <b style={{ color: '#7c3aed' }}>{shown.length}</b> ta mahsulot
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-20" style={{ color: '#7c3aed' }}>
            <Loader2 size={32} className="animate-spin" />
          </div>
        ) : shown.length > 0 ? (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map((product) => (
              <ProductCard key={product.id} product={product} {...actions} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed p-12 text-center" style={{ borderColor: '#e2e8f0' }}>
            <span className="mx-auto grid size-16 place-items-center rounded-full" style={{ background: '#f5f0ff', color: '#a78bfa' }}>
              <Package size={32} />
            </span>
            <p className="mt-4 font-bold" style={{ color: '#334155' }}>
              {products.length === 0 ? 'Mahsulotlar tez orada!' : 'Bu kategoriyada mahsulot topilmadi'}
            </p>
            <p className="mt-2 text-sm" style={{ color: '#94a3b8' }}>
              {products.length === 0 ? 'Admin bot orqali qo\'shiladi.' : 'Boshqa kategoriyani tanlang.'}
            </p>
          </div>
        )}
      </section>
    </>
  )
}
