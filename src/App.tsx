import { useState, useEffect } from 'react'
import { LoadingPage, LandingPage, MenuPage, CartPage } from './components'

interface CartItem {
  id: number
  title: string
  price: number
  quantity: number
  variant?: string
}

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<'landing' | 'menu' | 'cart'>('landing')
  const [cart, setCart] = useState<CartItem[]>([])

  useEffect(() => {
    // Имитация загрузки
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

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