import { useState, useEffect } from 'react'
import { LoadingPage, LandingPage, MenuPage, CartPage, CheckoutPage } from './components'

interface CartItem {
  id: number
  title: string
  price: number
  quantity: number
  variant?: string
}

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<'landing' | 'menu' | 'cart' | 'checkout'>('landing')
  const [cart, setCart] = useState<CartItem[]>([])
  const [menuScrollPosition, setMenuScrollPosition] = useState(0)
  // const [savedCategory, setSavedCategory] = useState<string>('')

  useEffect(() => {
    // Имитация загрузки
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Функция для плавного перехода между страницами
  const navigateWithAnimation = (page: 'landing' | 'menu' | 'cart' | 'checkout') => {
    // Сохраняем позицию скролла при уходе с MenuPage в корзину или оформление
    if (currentPage === 'menu' && (page === 'cart' || page === 'checkout')) {
      const scrollPosition = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0
      setMenuScrollPosition(scrollPosition)
      console.log('Сохранили позицию скролла:', scrollPosition) // Для отладки
    }
    
    setCurrentPage(page)
    
    // Для CartPage и CheckoutPage сразу скроллим к верху ПОСЛЕ смены страницы
    if (page === 'cart' || page === 'checkout') {
      setTimeout(() => {
        window.scrollTo(0, 0)
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0
      }, 0)
    }
    
    // Восстанавливаем позицию скролла ТОЛЬКО при возврате из корзины/оформления на MenuPage
    if (page === 'menu' && (currentPage === 'cart' || currentPage === 'checkout') && menuScrollPosition > 0) {
      console.log('Восстанавливаем позицию скролла:', menuScrollPosition) // Для отладки
      
      // Используем requestAnimationFrame для более точного восстановления
      requestAnimationFrame(() => {
        window.scrollTo(0, menuScrollPosition)
        document.documentElement.scrollTop = menuScrollPosition
        document.body.scrollTop = menuScrollPosition
        
        // Дополнительная проверка и корректировка
        requestAnimationFrame(() => {
          if (Math.abs(window.scrollY - menuScrollPosition) > 10) {
            window.scrollTo(0, menuScrollPosition)
          }
          console.log('Скролл выполнен, целевая позиция:', menuScrollPosition, 'текущая позиция:', window.scrollY)
        })
      })
    }
  }

  const handleOrderComplete = () => {
    setCart([])
    navigateWithAnimation('menu')
  }

  if (isLoading) {
    return <LoadingPage />
  }

  // Контейнер с анимацией
  const pageContent = () => {
    if (currentPage === 'landing') {
      return <LandingPage onNavigateToMenu={() => navigateWithAnimation('menu')} />
    }

    if (currentPage === 'cart') {
      return (
        <CartPage 
          cart={cart}
          onNavigateBack={() => navigateWithAnimation('menu')}
          onUpdateCart={setCart}
          onNavigateToCheckout={() => navigateWithAnimation('checkout')}
        />
      )
    }

    if (currentPage === 'checkout') {
      return (
        <CheckoutPage 
          cart={cart}
          onNavigateBack={() => navigateWithAnimation('cart')}
          onOrderComplete={handleOrderComplete}
        />
      )
    }

    return (
      <MenuPage 
        onNavigateToLanding={() => navigateWithAnimation('landing')}
        onNavigateToCart={() => navigateWithAnimation('cart')}
        cart={cart}
        onUpdateCart={setCart}
      />
    )
  }

  return (
    <div>
      {pageContent()}
    </div>
  )
}

export default App 