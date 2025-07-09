import { useEffect } from 'react'

interface CartPageProps {
  cart: CartItem[]
  onNavigateBack: () => void
  onUpdateCart: (cart: CartItem[]) => void
  onNavigateToCheckout: () => void
}

interface CartItem {
  id: number
  title: string
  price: number
  quantity: number
  variant?: string
}

export default function CartPage({ cart, onNavigateBack, onUpdateCart, onNavigateToCheckout }: CartPageProps) {
  // Автоматическая прокрутка к верху при открытии корзины
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const addToCart = (item: CartItem) => {
    const newCart = cart.map(cartItem =>
      cartItem.id === item.id && cartItem.variant === item.variant
        ? { ...cartItem, quantity: cartItem.quantity + 1 }
        : cartItem
    )
    onUpdateCart(newCart)
  }

  const removeFromCart = (itemId: number, variant?: string) => {
    const existingItem = cart.find(cartItem => cartItem.id === itemId && cartItem.variant === variant)
    if (existingItem && existingItem.quantity > 1) {
      const newCart = cart.map(cartItem =>
        cartItem.id === itemId && cartItem.variant === variant
          ? { ...cartItem, quantity: cartItem.quantity - 1 }
          : cartItem
      )
      onUpdateCart(newCart)
    } else {
      const newCart = cart.filter(cartItem => !(cartItem.id === itemId && cartItem.variant === variant))
      onUpdateCart(newCart)
    }
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const submitOrder = () => {
    onNavigateToCheckout()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* App Bar - Sticky Header */}
      <header className="sticky top-0 z-50 px-4 py-3" style={{ background: 'linear-gradient(to top, #0B73FE, #5BA1FF)' }}>
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Back Arrow */}
          <button 
            onClick={onNavigateBack}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          {/* Title */}
          <h1 className="text-xl font-bold text-white">Корзина</h1>
          
          {/* Empty div for spacing */}
          <div className="w-6"></div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6 pb-24">
        {cart.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6m0 0L3 3m4 10v6a2 2 0 002 2h6a2 2 0 002-2v-6" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg mb-4">Корзина пуста</p>
            <p className="text-gray-400 text-sm">Добавьте товары из меню</p>
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div className="space-y-4 mb-6">
              {cart.map((item, index) => (
                <div key={`${item.id}-${item.variant || 'default'}-${index}`} className="flex items-start gap-3">
                  {/* Image */}
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
                      <img
                        src="/logo_aero3.svg"
                        alt={item.title}
                        className="w-7 h-7 object-contain opacity-60"
                      />
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-primary-900 text-xs leading-tight">{item.title}</h3>
                    {item.variant && (
                      <p className="text-xs text-gray-600 capitalize mt-1">{item.variant}</p>
                    )}
                    <p className="text-xs font-bold text-primary-900 mt-2">{item.price} ₽</p>
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="flex items-center bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                    <button 
                      onClick={() => removeFromCart(item.id, item.variant)}
                      className="p-2 hover:bg-gray-200 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    
                    <div className="px-3 py-2 font-semibold text-primary-900 min-w-[40px] text-center text-xs flex-1">
                      {item.quantity}
                    </div>
                    
                    <button 
                      onClick={() => addToCart(item)}
                      className="p-2 hover:bg-gray-200 transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Promo Code Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <span className="text-primary-900 font-medium">Промокод</span>
                <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
              </div>
            </div>

            {/* Bonuses Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div>
                  <div className="text-primary-900 font-medium">Бонусы</div>
                  <div className="text-xs text-gray-500">Можно списать 50% от суммы заказа (сейчас 0 бонусов)</div>
                </div>
                <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
              </div>
            </div>

            {/* Bonus Offer */}
            <div className="mb-4">
              <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl p-4 relative">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded inline-block mb-2">
                      X2 бонусов
                    </div>
                    <div className="text-sm text-gray-700">
                      Если зарегистрируетесь, получите в два раза больше бонусов - ❤️ {Math.round(getTotalPrice() * 0.2)}
                    </div>
                  </div>
                  <button className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium ml-4">
                    Регистрация
                  </button>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Начислим бонусы</span>
                <span className="font-semibold text-red-500">{Math.round(getTotalPrice() * 0.1)} ❤️</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary-900">Итого</span>
                <span className="text-2xl font-bold text-primary-900">{getTotalPrice()} ₽</span>
              </div>
            </div>


          </>
        )}
      </main>

      {/* Order Button - Fixed at bottom */}
      {cart.length > 0 && (
        <div 
          className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-3"
          style={{ borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}
        >
          <button 
            onClick={submitOrder}
            className="w-full text-white font-semibold transition-colors flex items-center justify-center px-6 rounded-full"
            style={{ 
              backgroundColor: '#1F1F1F',
              height: '42px',
              fontSize: '14px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#333333';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1F1F1F';
            }}
          >
            Оформить заказ
          </button>
        </div>
      )}
    </div>
  )
} 