import React, { useState } from 'react'
import { UsersManagement } from './UsersManagement'
import { OrdersManagement } from './OrdersManagement'

interface AdminPageProps {
  onBack: () => void
}

export const AdminPage: React.FC<AdminPageProps> = ({ onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentView, setCurrentView] = useState<'dashboard' | 'users' | 'orders'>('dashboard')
  
  console.log('AdminPage render, currentView:', currentView);

  // Временный пароль для демонстрации (в продакшене должен быть в env)
  const ADMIN_PASSWORD = 'admin123'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Имитация проверки пароля
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        setIsAuthenticated(true)
        localStorage.setItem('adminAuth', 'true')
      } else {
        setError('Неверный пароль')
      }
      setLoading(false)
    }, 500)
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('adminAuth')
    setPassword('')
  }

  // Проверяем авторизацию при загрузке
  React.useEffect(() => {
    const savedAuth = localStorage.getItem('adminAuth')
    if (savedAuth === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  // Форма авторизации
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Админ панель
              </h1>
              <p className="text-gray-600">
                Введите пароль для доступа
              </p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Пароль
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите пароль"
                  required
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Проверка...' : 'Войти'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={onBack}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ← Назад к меню
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Показать управление пользователями
  if (currentView === 'users') {
    return <UsersManagement onBack={() => setCurrentView('dashboard')} />
  }

  // Показать управление заказами
  if (currentView === 'orders') {
    console.log('Показываем OrdersManagement');
    return <OrdersManagement onBack={() => setCurrentView('dashboard')} />
  }

  // Основная админ панель
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                Админ панель
              </h1>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Статистика */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Быстрая статистика
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Заказов сегодня:</span>
                <span className="font-semibold">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Активных пользователей:</span>
                <span className="font-semibold">45</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Выручка за день:</span>
                <span className="font-semibold">₽2,340</span>
              </div>
            </div>
          </div>

          {/* Управление заказами */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Управление заказами
            </h3>
            <div className="space-y-3">
              <button 
                onClick={() => setCurrentView('orders')}
                className="w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
              >
                📋 Все заказы
              </button>
              <button className="w-full text-left px-4 py-2 bg-yellow-50 text-yellow-700 rounded-md hover:bg-yellow-100 transition-colors">
                ⏳ Ожидающие
              </button>
              <button className="w-full text-left px-4 py-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors">
                ✅ Завершенные
              </button>
            </div>
          </div>

          {/* Управление меню */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Управление меню
            </h3>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-2 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors">
                🍽️ Все блюда
              </button>
              <button className="w-full text-left px-4 py-2 bg-emerald-50 text-emerald-700 rounded-md hover:bg-emerald-100 transition-colors">
                ➕ Добавить блюдо
              </button>
              <button className="w-full text-left px-4 py-2 bg-orange-50 text-orange-700 rounded-md hover:bg-orange-100 transition-colors">
                📂 Категории
              </button>
            </div>
          </div>

          {/* Управление пользователями */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Управление пользователями
            </h3>
            <div className="space-y-3">
              <button 
                onClick={() => setCurrentView('users')}
                className="w-full text-left px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition-colors"
              >
                👥 Все пользователи
              </button>
              <button className="w-full text-left px-4 py-2 bg-pink-50 text-pink-700 rounded-md hover:bg-pink-100 transition-colors">
                🎁 Управление бонусами
              </button>
              <button className="w-full text-left px-4 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors">
                🚫 Заблокированные
              </button>
            </div>
          </div>
        </div>

        {/* Последние заказы */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Последние заказы
            </h3>
          </div>
          <div className="p-6">
            <div className="text-center text-gray-500 py-8">
              <p>Здесь будет список последних заказов</p>
              <p className="text-sm mt-2">Функционал будет добавлен на следующем этапе</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 