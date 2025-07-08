interface CartPageProps {
  cart: CartItem[]
  onNavigateBack: () => void
  onUpdateCart: (cart: CartItem[]) => void
}

interface CartItem {
  id: number
  title: string
  price: number
  quantity: number
  variant?: string
}

export default function CartPage({ cart, onNavigateBack, onUpdateCart }: CartPageProps) {
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
    // Здесь будет логика отправки заказа
    // В продакшене здесь будет отправка на сервер
    // TODO: Интегрировать с API для отправки заказа
    alert('Заказ принят! Мы свяжемся с вами в ближайшее время.')
    // Очищаем корзину после заказа
    onUpdateCart([])
    onNavigateBack()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* App Bar - Sticky Header */}
      <header className="sticky top-0 z-50 px-4 py-3 bg-primary-900">
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
                <div key={`${item.id}-${item.variant || 'default'}-${index}`} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-primary-900">{item.title}</h3>
                      {item.variant && (
                        <p className="text-sm text-gray-600 capitalize mt-1">{item.variant}</p>
                      )}
                      <p className="text-lg font-bold text-accent-500 mt-2">{item.price} ₽</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => removeFromCart(item.id, item.variant)}
                        className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      
                      <span className="min-w-[40px] text-center font-semibold text-lg">
                        {item.quantity}
                      </span>
                      
                      <button 
                        onClick={() => addToCart(item)}
                        className="w-10 h-10 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">Товаров:</span>
                <span className="font-semibold">{cart.reduce((total, item) => total + item.quantity, 0)} шт.</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary-900">Итого:</span>
                <span className="text-2xl font-bold text-accent-500">{getTotalPrice()} ₽</span>
              </div>
            </div>

            {/* Order Button */}
            <button 
              onClick={submitOrder}
              className="w-full bg-accent-500 hover:bg-accent-600 text-primary-900 font-bold py-4 px-6 rounded-2xl shadow-lg transition-colors text-lg"
            >
              Оформить заказ
            </button>
          </>
        )}
      </main>
    </div>
  )
} 