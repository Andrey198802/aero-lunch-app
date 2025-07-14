import { useState } from 'react'

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
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery')
  const [showTimeModal, setShowTimeModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState('Сегодня')
  const [selectedTime, setSelectedTime] = useState('11:45')
  const [isAsap, setIsAsap] = useState(true)
  const [flightNumber, setFlightNumber] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getDisplayText = () => {
    if (isAsap) {
      return 'Как можно скорее'
    }
    return `${selectedDate}, ${selectedTime}`
  }

  // Генерация дат на 2 месяца вперед
  const generateDates = () => {
    const dates = []
    const today = new Date()
    const endDate = new Date()
    endDate.setMonth(today.getMonth() + 2)

    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
    const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
                       'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']

    for (let date = new Date(today); date <= endDate; date.setDate(date.getDate() + 1)) {
      const isToday = date.toDateString() === today.toDateString()
      const isTomorrow = date.toDateString() === new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString()
      const isPast = date < today && !isToday
      
      let label = ''
      if (isToday) {
        label = 'Сегодня'
      } else if (isTomorrow) {
        label = 'Завтра'
      } else {
        const dayName = dayNames[date.getDay()]
        const day = date.getDate()
        const month = monthNames[date.getMonth()]
        label = `${dayName} ${day} ${month}`
      }

      dates.push({
        label,
        day: date.getDate().toString().padStart(2, '0'),
        time: (30 + Math.floor(Math.random() * 30)).toString(), // Случайное время от 30 до 59
        disabled: isPast,
        isToday,
        date: new Date(date)
      })
    }

    return dates
  }

  // Генерация времени с текущего времени + 30 минут до 00:00
  const generateTimes = () => {
    const times = []
    const now = new Date()
    
    // Если выбрана сегодняшняя дата, начинаем с текущего времени + 30 минут
    let startHour = 0
    let startMinute = 0
    
    if (selectedDate === 'Сегодня') {
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      
      // Добавляем 30 минут к текущему времени
      let nextHour = currentHour
      let nextMinute = currentMinute + 30
      
      if (nextMinute >= 60) {
        nextHour += 1
        nextMinute -= 60
      }
      
      // Округляем до ближайшего получаса
      if (nextMinute > 0 && nextMinute <= 30) {
        nextMinute = 30
      } else if (nextMinute > 30) {
        nextHour += 1
        nextMinute = 0
      }
      
      startHour = nextHour
      startMinute = nextMinute
    }
    
    // Генерируем время круглосуточно
    for (let hour = startHour; hour < 24; hour++) {
      const hourStr = hour.toString().padStart(2, '0')
      
      // Для первого часа учитываем стартовую минуту
      if (hour === startHour && selectedDate === 'Сегодня') {
        if (startMinute === 0) {
          times.push(`${hourStr}:00`)
          times.push(`${hourStr}:30`)
        } else if (startMinute === 30) {
          times.push(`${hourStr}:30`)
        }
      } else {
        times.push(`${hourStr}:00`)
        times.push(`${hourStr}:30`)
      }
    }
    
    // Если не сегодня, добавляем полный цикл с 00:00
    if (selectedDate !== 'Сегодня') {
      const fullDayTimes = []
      for (let hour = 0; hour < 24; hour++) {
        const hourStr = hour.toString().padStart(2, '0')
        fullDayTimes.push(`${hourStr}:00`)
        fullDayTimes.push(`${hourStr}:30`)
      }
      return fullDayTimes
    }
    
    return times
  }

  const dates = generateDates()
  const times = generateTimes()

  const submitOrder = async () => {
    setIsSubmitting(true)
    try {
      const initData = window.Telegram?.WebApp?.initData
      
      if (!initData) {
        console.error('Нет данных Telegram')
        alert('Ошибка: нет данных авторизации')
        return
      }

      // Подготавливаем данные заказа
      const orderData = {
        items: cart.map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          variant: item.variant
        })),
        deliveryType: deliveryType === 'delivery' ? 'ONBOARD' : 'TAKEAWAY',
        flightNumber: flightNumber || null,
        customerName: name || null,
        phone: phone || null,
        email: email || null,
        notes: `Заказ через Web App. Время: ${getDisplayText()}`,
        deliveryTime: isAsap ? null : new Date(`${selectedDate} ${selectedTime}`).toISOString(),
        bonusesUsed: 0,
        promoCode: null
      }

      console.log('Отправляем заказ:', orderData)

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData
        },
        body: JSON.stringify(orderData)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Заказ успешно создан:', result)
        // Сразу переходим на главное меню без модального окна
        onOrderComplete()
      } else {
        const error = await response.json()
        console.error('Ошибка создания заказа:', error)
        alert(`Ошибка создания заказа: ${error.error || 'Неизвестная ошибка'}`)
      }
    } catch (error) {
      console.error('Ошибка при отправке заказа:', error)
      alert('Ошибка при отправке заказа. Попробуйте еще раз.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* App Bar - Sticky Header */}
      <header className="sticky top-0 z-50 py-3" style={{ background: 'linear-gradient(to top, #0B73FE, #5BA1FF)' }}>
        <div className="max-w-md mx-auto flex items-center justify-between px-4">
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
      <main className="px-4 py-6 pb-24">
        {/* Выбор типа получения */}
        <div className="relative bg-gray-100 rounded-2xl p-1 mb-6">
          {/* Желтый бейдж со скидкой */}
          <div className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">
            -10%
          </div>
          
          <div className="flex">
            {/* На борт */}
            <button
              onClick={() => setDeliveryType('delivery')}
              className={`flex-1 py-2 px-3 rounded-xl font-medium transition-all ${
                deliveryType === 'delivery'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              На борт
            </button>
            
            {/* С собой */}
            <button
              onClick={() => setDeliveryType('pickup')}
              className={`flex-1 py-2 px-3 rounded-xl font-medium transition-all ${
                deliveryType === 'pickup'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              С собой
            </button>
          </div>
        </div>

        {/* Время доставки */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-0" style={{ color: '#6E6E6E' }}>
            Время доставки
          </label>
          
          <div className="relative">
            <button
              onClick={() => setShowTimeModal(true)}
              className="w-full appearance-none bg-white border-b-2 border-gray-500 py-3 pr-8 focus:outline-none focus:border-blue-500 transition-colors text-left font-semibold"
              style={{ color: '#464646', fontSize: '15px' }}
            >
              {getDisplayText()}
            </button>
            
            {/* Стрелка вниз */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Номер борта */}
        <div className="mb-6 mt-11">
          <label className="block text-sm font-semibold mb-0" style={{ color: '#6E6E6E' }}>
            Номер борта
          </label>
          
          <div className="relative">
            <input
              type="text"
              value={flightNumber}
              onChange={(e) => setFlightNumber(e.target.value)}
              placeholder="Введите номер борта"
              className="w-full appearance-none bg-white border-b-2 border-gray-500 py-3 pr-8 focus:outline-none focus:border-blue-500 transition-colors text-left font-semibold"
              style={{ color: '#464646', fontSize: '15px' }}
            />
            
            {/* Иконка карандаша */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Имя */}
        <div className="mb-6 mt-11">
          <label className="block text-sm font-semibold mb-0" style={{ color: '#6E6E6E' }}>
            Имя
          </label>
          
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите ваше имя"
              className="w-full appearance-none bg-white border-b-2 border-gray-500 py-3 pr-8 focus:outline-none focus:border-blue-500 transition-colors text-left font-semibold"
              style={{ color: '#464646', fontSize: '15px' }}
            />
            
            {/* Иконка карандаша */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Телефон */}
        <div className="mb-6 mt-11">
          <label className="block text-sm font-semibold mb-0" style={{ color: '#6E6E6E' }}>
            Телефон
          </label>
          
          <div className="relative">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Введите номер телефона"
              className="w-full appearance-none bg-white border-b-2 border-gray-500 py-3 pr-8 focus:outline-none focus:border-blue-500 transition-colors text-left font-semibold"
              style={{ color: '#464646', fontSize: '15px' }}
            />
            
            {/* Иконка карандаша */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Почта */}
        <div className="mb-6 mt-11">
          <label className="block text-sm font-semibold mb-0" style={{ color: '#6E6E6E' }}>
            Почта
          </label>
          
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Введите email адрес"
              className="w-full appearance-none bg-white border-b-2 border-gray-500 py-3 pr-8 focus:outline-none focus:border-blue-500 transition-colors text-left font-semibold"
              style={{ color: '#464646', fontSize: '15px' }}
            />
            
            {/* Иконка карандаша */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Промокод */}
        <div className="mb-4 mt-11">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
            <span className="text-primary-900 font-medium">Промокод</span>
            <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
          </div>
        </div>

        {/* Бонусы */}
        <div className="mb-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
            <div>
              <div className="text-primary-900 font-medium">Бонусы</div>
              <div className="text-xs text-gray-500">Можно списать 50% от суммы заказа (сейчас 0 бонусов)</div>
            </div>
            <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
          </div>
        </div>

        {/* Итого */}
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
      </main>

      {/* Фиксированная кнопка заказа */}
      <div 
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 fixed-bottom py-3"
        style={{ borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}
      >
        <button 
          onClick={submitOrder}
          disabled={isSubmitting}
          className="w-full text-white font-semibold transition-colors flex items-center justify-center px-6 rounded-full"
          style={{ 
            backgroundColor: isSubmitting ? '#666666' : '#1F1F1F',
            height: '42px',
            fontSize: '14px'
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.backgroundColor = '#333333';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.backgroundColor = '#1F1F1F';
            }
          }}
        >
          {isSubmitting ? 'Отправляем...' : 'Заказать'}
        </button>
      </div>

      {/* Модальное окно выбора времени */}
      {showTimeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[75vh] overflow-hidden">
            {/* Заголовок */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Время доставки</h2>
              <button
                onClick={() => setShowTimeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Контент с прокруткой */}
            <div className="flex-1 overflow-hidden max-h-[55vh]">
              <div className="flex gap-4 h-full">
                {/* Секция выбора даты */}
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-600 mb-3">Выберите дату</h3>
                  <div className="space-y-1 h-[45vh] overflow-y-auto bg-gray-50 rounded-lg p-2">
                    {dates.map((date, index) => (
                      <button
                        key={index}
                        onClick={() => !date.disabled && setSelectedDate(date.label)}
                        disabled={date.disabled}
                        className={`w-full flex items-center justify-start p-3 rounded-lg transition-colors ${
                          date.disabled
                            ? 'text-gray-300 cursor-not-allowed'
                            : selectedDate === date.label
                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                            : 'text-gray-700 hover:bg-white'
                        }`}
                      >
                        <span className="font-medium text-sm">{date.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Секция выбора времени */}
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-600 mb-3">Выберите время</h3>
                  <div className="space-y-1 h-[45vh] overflow-y-auto bg-gray-50 rounded-lg p-2">
                    {times.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`w-full flex items-center justify-start p-3 rounded-lg transition-colors ${
                          selectedTime === time
                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                            : 'text-gray-700 hover:bg-white'
                        }`}
                      >
                        <span className="font-medium text-sm">{time}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Кнопки внизу */}
            <div className="border-t border-gray-200 pt-4">
              {/* Кнопка Применить */}
              <button
                onClick={() => {
                  setShowTimeModal(false)
                  setIsAsap(false)
                }}
                className="w-full bg-black text-white py-3 rounded-2xl font-medium mb-3"
              >
                Применить
              </button>

              {/* Как можно скорее */}
              <button
                onClick={() => {
                  setIsAsap(true)
                  setShowTimeModal(false)
                }}
                className="w-full text-gray-600 py-3 text-center"
              >
                Как можно скорее
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 