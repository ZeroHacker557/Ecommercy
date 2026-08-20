import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight, Bell, CircleHelp, Gem, Heart, Home, Laptop, Loader2,
  Package, Search, Shirt, ShieldCheck, ShoppingBag, Star, Truck,
} from 'lucide-react'
import heroImg from '../images/hero-img.png'
import { formatPrice } from '../data'
import { ProductCard } from '../components/product/ProductCard'
import { CartButton } from '../components/ui/CartButton'
import { IconButton } from '../components/ui/IconButton'
import type { AppPage, Category, Product, ProductActions } from '../types/domain'

const defaultCategories = [
  { label: 'Barchasi', icon: ShoppingBag, color: 'purple' },
  { label: 'Kiyim', icon: Shirt, color: 'green' },
  { label: 'Elektronika', icon: Laptop, color: 'orange' },
  { label: 'Uy uchun', icon: Home, color: 'rose' },
  { label: 'Zargarlik', icon: Gem, color: 'blue' },
  { label: 'Ko\'proq', icon: Package, color: 'amber' },
]

const benefits: [LucideIcon, string, string][] = [
  [Truck, 'Tez yetkazib berish', '1-3 kun ichida'],
  [ShieldCheck, 'Xavfsiz to\'lov', '100% kafolat'],
  [CircleHelp, '24/7 qo\'llab-quvvatlash', 'Har doim siz bilan'],
  [Package, '14 kun ichida qaytarish', 'Oson va qulay'],
]

type Props = ProductActions & {
  products: Product[]
  categories: Category[]
  loading: boolean
  cartCount: number
  onSearch: () => void
  onNavigate: (page: AppPage) => void
  onOpenCart: () => void
  onNotify: (message: string) => void
}

export function HomePage({ products, categories, loading, cartCount, onSearch, onNavigate, onOpenCart, onNotify, ...productActions }: Props) {
  const carouselItems = [...defaultCategories, ...defaultCategories]

  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-7 sm:px-10">
        <div className="flex items-center gap-2">
          <span className="grid size-11 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-violet-700 shadow-lg shadow-violet-200" style={{ color: '#fff' }}>
            <ShoppingBag />
          </span>
          <b className="text-2xl tracking-tight sm:text-3xl" style={{ color: '#111426' }}>
            Shop<span style={{ color: '#7c3aed' }}>Online</span>
          </b>
        </div>
        <div className="flex items-center gap-2">
          <IconButton label="Bildirishnomalar" onClick={() => onNotify('Yangi bildirishnomalar yo\'q')}>
            <Bell />
          </IconButton>
          <IconButton label="Sevimlilar" onClick={() => onNavigate('favorites')}>
            <Heart />
          </IconButton>
          <CartButton count={cartCount} onClick={onOpenCart} />
        </div>
      </header>

      {/* Search Bar */}
      <section className="px-5 pt-7 sm:px-10">
        <button
          onClick={onSearch}
          className="flex h-14 w-full items-center gap-3 rounded-[24px] border border-slate-100 px-5 text-left shadow-sm transition hover:border-violet-200 hover:shadow-md"
          style={{ color: '#94a3b8', background: 'rgba(248,250,252,0.5)' }}
        >
          <Search className="shrink-0" />
          <span>Mahsulot yoki kategoriya qidiring...</span>
        </button>
      </section>

      {/* Hero Banner */}
      <section className="mx-5 mt-7 sm:mx-10">
        <div className="hero-banner">
          <div className="relative min-h-[280px] p-7 sm:min-h-[350px] sm:p-10">
            <div className="hero-text relative z-10 max-w-[280px] sm:max-w-[360px]">
              <span className="inline-block rounded-full px-3 py-1 text-xs font-bold" style={{ background: 'rgba(196, 167, 255, 0.45)', color: '#5b21b6' }}>
                Yangi kolleksiya
              </span>
              <h2 className="mt-5 text-[1.75rem] font-extrabold leading-tight sm:text-5xl" style={{ color: '#111426' }}>
                Siz izlagan<br />hamma narsa<br />shu yerda <span style={{ color: '#7c3aed' }}>✦</span>
              </h2>
              <p className="mt-4 text-sm sm:text-base" style={{ color: '#64748b' }}>
                Sifatli mahsulotlar,<br />qulay narxlarda!
              </p>
              <button
                onClick={() => onNavigate('catalog')}
                className="mt-6 flex items-center gap-3 rounded-full px-6 py-3 font-bold shadow-lg transition hover:-translate-y-1 hover:shadow-xl active:scale-95"
                style={{ background: 'linear-gradient(135deg, #6d28d9, #7c3aed)', color: '#fff', boxShadow: '0 8px 24px rgba(124, 58, 237, 0.35)' }}
              >
                Xarid qilish <ArrowRight />
              </button>
            </div>
            <div className="absolute -right-4 bottom-0 h-[85%] w-[48%] rounded-tl-[60px] sm:-right-7 sm:h-[88%] sm:w-[50%] sm:rounded-tl-full" style={{ background: 'rgba(167, 139, 250, 0.25)' }} />
            <img
              className="absolute bottom-0 right-0 h-[80%] w-[48%] object-contain sm:h-[91%] sm:w-[55%]"
              src={heroImg}
              alt="ShopOnline"
            />
          </div>
        </div>
      </section>

      {/* Categories — Auto-scroll Carousel */}
      <section className="mt-7 px-0">
        <div className="category-carousel-wrapper">
          <div className="category-carousel-track">
            {carouselItems.map(({ label, icon: Icon, color }, idx) => (
              <button onClick={() => onNavigate('catalog')} key={`${label}-${idx}`} className="category-card">
                <span className={`category-icon-wrap ${color}`}>
                  <Icon size={24} />
                </span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-5 mt-6 grid grid-cols-2 rounded-3xl border border-slate-100 bg-white p-3 shadow-sm sm:mx-10 sm:grid-cols-4">
        {benefits.map(([Icon, title, subtitle]) => (
          <button onClick={() => onNotify(`${title}: ${subtitle}`)} key={title} className="benefit-item">
            <span className="grid size-9 shrink-0 place-items-center rounded-full" style={{ background: '#f5f0ff', color: '#7c3aed' }}>
              <Icon size={20} />
            </span>
            <p className="text-[11px] font-bold leading-tight sm:text-xs" style={{ color: '#111426' }}>
              {title}
              <small className="mt-1 block font-normal" style={{ color: '#94a3b8' }}>{subtitle}</small>
            </p>
          </button>
        ))}
      </section>

      {/* Popular Products */}
      <section className="px-5 pb-32 pt-8 sm:px-10">
        <div className="flex items-center justify-between">
          <h2 className="section-title">Mashhur mahsulotlar</h2>
          <button onClick={() => onNavigate('catalog')} className="text-sm font-bold transition hover:opacity-80" style={{ color: '#7c3aed' }}>
            Barchasini ko'rish
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16" style={{ color: '#7c3aed' }}>
            <Loader2 size={32} className="animate-spin" />
          </div>
        ) : products.length > 0 ? (
          <div className="mt-5 flex gap-4 overflow-x-auto pb-2 scrollbar-none">
            {products.slice(0, 6).map((product) => (
              <ProductCard key={product.id} product={product} compact {...productActions} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-3xl border border-dashed p-10 text-center" style={{ borderColor: '#e2e8f0' }}>
            <span className="mx-auto grid size-16 place-items-center rounded-full" style={{ background: '#f5f0ff', color: '#a78bfa' }}>
              <ShoppingBag size={32} />
            </span>
            <p className="mt-4 font-bold" style={{ color: '#334155' }}>Mahsulotlar tez orada!</p>
            <p className="mt-2 text-sm" style={{ color: '#94a3b8' }}>Admin bot orqali mahsulotlar qo'shilganda shu yerda ko'rinadi.</p>
          </div>
        )}
      </section>
    </>
  )
}
