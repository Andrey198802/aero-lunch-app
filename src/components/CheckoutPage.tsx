import { useState, useEffect } from 'react'

interface CartItem {
  id: number
  title: string
  price: number
  quantity: number
  variant?: string
}

interface CheckoutPageProps {
  cart: CartItem[]
  onNavigateBack: () => void
  onOrderComplete: () => void
}

export default function CheckoutPage({ cart, onNavigateBack, onOrderComplete }: CheckoutPageProps) {
  // Автоматическая прокрутка к верху при открытии страницы
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const [formData, setFormData] = useState({
    departureDate: '',
    deliveryTime: '',
    flightNumber: '',
    name: '',
    email: '',
    phone: '',
    asap: false
  })

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Здесь будет логика отправки заказа
    alert('Заказ успешно оформлен! Мы свяжемся с вами в ближайшее время.')
    onOrderComplete()
  }

  const isFormValid = () => {
    // Обязательными являются номер рейса и телефон
    return formData.flightNumber.trim() !== '' && formData.phone.trim() !== ''
  }

  return (
    <div className="min-h-screen bg-white">
      {/* App Bar - Sticky Header */}
      <header className="sticky top-0 z-50 fixed-header py-3" style={{ background: 'linear-gradient(to top, #0B73FE, #5BA1FF)' }}>
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
          <h1 className="text-xl font-bold text-white">Оформление заказа</h1>
          
          {/* Empty div for spacing */}
          <div className="w-6"></div>
        </div>
      </header>

      {/* Content */}
      <main className="content-safe py-6 pb-24">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Выбор времени доставки */}
          <div>
            <label className="block text-sm font-medium text-primary-900 mb-2">
              Время доставки
            </label>
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                id="asap"
                checked={formData.asap}
                onChange={(e) => handleInputChange('asap', e.target.checked)}
                className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="asap" className="text-sm text-primary-900">
                Как можно скорее
              </label>
            </div>
            
            {!formData.asap && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Дата вылета
                  </label>
                  <input
                    type="date"
                    value={formData.departureDate}
                    onChange={(e) => handleInputChange('departureDate', e.target.value)}
                    className="w-full p-4 bg-white border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-primary-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Время подачи на борт
                  </label>
                  <select
                    value={formData.deliveryTime}
                    onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
                    className="w-full p-4 bg-white border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-primary-900"
                  >
                    <option value="">Выберите время</option>
                    {Array.from({ length: 96 }, (_, i) => {
                      const hours = Math.floor(i / 4);
                      const minutes = (i % 4) * 15;
                      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                      return (
                        <option key={timeString} value={timeString}>
                          {timeString}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Номер рейса */}
          <div>
            <label className="block text-sm font-medium text-primary-900 mb-2">
              Номер рейса <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.flightNumber}
              onChange={(e) => handleInputChange('flightNumber', e.target.value)}
              placeholder="Например: SU123"
              className="w-full p-4 bg-white border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-primary-900 placeholder-gray-400"
              required
            />
          </div>

          {/* Имя */}
          <div>
            <label className="block text-sm font-medium text-primary-900 mb-2">
              Имя
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Введите ваше имя"
              className="w-full p-4 bg-white border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-primary-900 placeholder-gray-400"
            />
          </div>

          {/* Почта */}
          <div>
            <label className="block text-sm font-medium text-primary-900 mb-2">
              Почта
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="example@mail.com"
              className="w-full p-4 bg-white border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-primary-900 placeholder-gray-400"
            />
          </div>

          {/* Телефон */}
          <div>
            <label className="block text-sm font-medium text-primary-900 mb-2">
              Телефон <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+7 (999) 123-45-67"
              className="w-full p-4 bg-white border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-primary-900 placeholder-gray-400"
              required
            />
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-2xl p-4 mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Начислим бонусы</span>
              <span className="font-semibold text-red-500">{Math.round(getTotalPrice() * 0.1)} ❤️</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-primary-900">Итого</span>
              <span className="text-2xl font-bold text-primary-900">{getTotalPrice()} ₽</span>
            </div>
          </div>
        </form>
      </main>

      {/* Order Button - Fixed at bottom */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 fixed-bottom py-3"
        style={{ borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}
      >
        <button 
          onClick={handleSubmit}
          disabled={!isFormValid()}
          className={`w-full text-white font-semibold transition-colors flex items-center justify-center px-6 rounded-full ${
            isFormValid() 
              ? 'hover:opacity-90' 
              : 'opacity-50 cursor-not-allowed'
          }`}
          style={{ 
            backgroundColor: '#FA742D',
            height: '42px',
            fontSize: '14px'
          }}
        >
          Заказать
        </button>
      </div>
    </div>
  )
} 