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

  useEffect(() => {
    // Имитация загрузки
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handleOrderComplete = () => {
    setCart([])
    setCurrentPage('menu')
  }

  if (isLoading) {
    return <LoadingPage />
  }

  if (currentPage === 'landing') {
    return <LandingPage onNavigateToMenu={() => setCurrentPage('menu')} />
  }

  if (currentPage === 'cart') {
    return (
      <CartPage 
        cart={cart}
        onNavigateBack={() => setCurrentPage('menu')}
        onUpdateCart={setCart}
        onNavigateToCheckout={() => setCurrentPage('checkout')}
      />
    )
  }

  if (currentPage === 'checkout') {
    return (
      <CheckoutPage 
        cart={cart}
        onNavigateBack={() => setCurrentPage('cart')}
        onOrderComplete={handleOrderComplete}
      />
    )
  }

  return (
    <MenuPage 
      onNavigateToLanding={() => setCurrentPage('landing')}
      onNavigateToCart={() => setCurrentPage('cart')}
      cart={cart}
      onUpdateCart={setCart}
    />
  )
}

export default App 