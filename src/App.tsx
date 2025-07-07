import { useState, useEffect } from 'react'
import { LoadingPage, LandingPage, MenuPage } from './components'

function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<'landing' | 'menu'>('landing')

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

  return (
    <MenuPage 
      onNavigateToLanding={() => setCurrentPage('landing')}
    />
  )
}

export default App 