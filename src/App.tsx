import { BottomNav } from './components/layout/BottomNav'
import { SearchOverlay } from './components/layout/SearchOverlay'
import { CartDrawer } from './components/cart/CartDrawer'
import { Toast } from './components/ui/Toast'
import { CheckoutSuccess } from './components/ui/CheckoutSuccess'
import { useShopStore } from './hooks/use-shop-store'
import { CatalogPage } from './pages/CatalogPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { FavoritesPage } from './pages/FavoritesPage'
import { HomePage } from './pages/HomePage'
import { OrdersPage } from './pages/OrdersPage'
import { ProductDetailPage } from './pages/ProductDetailPage'
import { ProfilePage } from './pages/ProfilePage'

function App() {
  const shop = useShopStore()
  const productActions = {
    onOpen: shop.openProduct,
    onAddToCart: shop.addToCart,
    likedIds: shop.likedIds,
    onToggleLike: shop.toggleLike,
  }

  return (
    <main className="app-shell">
      <div className="app-container">
        {/* Search Overlay */}
        {shop.isSearchOpen && (
          <SearchOverlay
            query={shop.query}
            results={shop.searchResults}
            onQueryChange={shop.setQuery}
            onClose={() => shop.setSearchOpen(false)}
            onOpenProduct={shop.openProduct}
          />
        )}

        {/* Cart Drawer */}
        {shop.isCartOpen && (
          <CartDrawer
            cartProducts={shop.cartProducts}
            cartTotal={shop.cartTotal}
            onClose={shop.closeCart}
            onUpdateQuantity={shop.updateCartQuantity}
            onCheckout={shop.goToCheckout}
          />
        )}

        {/* Toast Notification */}
        {shop.toast && <Toast message={shop.toast} onClose={shop.clearToast} />}

        {/* Checkout Success Modal */}
        {shop.checkoutDone && <CheckoutSuccess onViewOrders={() => shop.navigate('orders')} />}

        {/* Pages */}
        <div className="page-wrapper">
          {shop.page === 'home' && (
            <div className="page-animate">
              <HomePage
                products={shop.products}
                categories={shop.categories}
                loading={shop.loading}
                {...productActions}
                cartCount={shop.cartCount}
                onSearch={() => shop.setSearchOpen(true)}
                onNavigate={shop.navigate}
                onOpenCart={shop.openCart}
                onNotify={shop.notify}
              />
            </div>
          )}
          {shop.page === 'catalog' && (
            <div className="page-animate">
              <CatalogPage
                products={shop.products}
                categories={shop.categories}
                loading={shop.loading}
                {...productActions}
                cartCount={shop.cartCount}
                onSearch={() => shop.setSearchOpen(true)}
                onOpenCart={shop.openCart}
              />
            </div>
          )}
          {shop.page === 'favorites' && (
            <div className="page-animate">
              <FavoritesPage
                products={shop.products}
                {...productActions}
                cartCount={shop.cartCount}
                onOpenCart={shop.openCart}
              />
            </div>
          )}
          {shop.page === 'orders' && (
            <div className="page-animate">
              <OrdersPage
                orders={shop.myOrders}
                cartCount={shop.cartCount}
                onSearch={() => shop.setSearchOpen(true)}
                onOpenCart={shop.openCart}
              />
            </div>
          )}
          {shop.page === 'profile' && (
            <div className="page-animate">
              <ProfilePage
                orders={shop.myOrders}
                onNavigate={shop.navigate}
                onNotify={shop.notify}
              />
            </div>
          )}
          {shop.page === 'detail' && shop.selectedProduct && (
            <div className="page-animate">
              <ProductDetailPage
                product={shop.selectedProduct}
                onAddToCart={() => shop.addToCart(shop.selectedProduct!)}
                onBack={() => shop.navigate('catalog')}
                likedIds={shop.likedIds}
                onToggleLike={shop.toggleLike}
                onOpenCart={shop.openCart}
                cartCount={shop.cartCount}
              />
            </div>
          )}
          {shop.page === 'checkout' && (
            <div className="page-animate">
              <CheckoutPage
                cartProducts={shop.cartProducts}
                cartTotal={shop.cartTotal}
                orderForm={shop.orderForm}
                onUpdateForm={shop.updateOrderForm}
                onSubmit={shop.submitOrder}
                onBack={() => shop.navigate('catalog')}
              />
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        {!['detail', 'checkout'].includes(shop.page) && (
          <BottomNav page={shop.page} onNavigate={shop.navigate} cartCount={shop.cartCount} />
        )}
      </div>
    </main>
  )
}

export default App
