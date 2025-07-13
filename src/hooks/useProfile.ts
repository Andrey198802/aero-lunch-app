import { useState, useEffect } from 'react'
import { UserProfile, UpdateProfileData } from '../types/telegram'

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Получаем данные авторизации
      const initData = window.Telegram?.WebApp?.initData || ''
      const user = window.Telegram?.WebApp?.initDataUnsafe?.user
      
      console.log('=== ОТЛАДКА ПРОФИЛЯ ===')
      console.log('initData:', initData)
      console.log('user:', user)
      console.log('window.Telegram:', window.Telegram)
      console.log('WebApp:', window.Telegram?.WebApp)
      
      // Временно всегда используем тестовые данные для отладки
      console.log('Используем тестовые данные для отладки')
      setProfile({
        id: 1,
        telegramId: user?.id || 123456789,
        firstName: user?.first_name || 'Тестовый',
        lastName: user?.last_name || 'Пользователь',
        username: user?.username || 'testuser',
        phone: '+7 (999) 123-45-67',
        email: 'test@example.com',
        birthDate: '1990-01-01',
        registrationDate: new Date().toISOString(),
        totalBonuses: 150,
        totalOrders: 5,
        totalSpent: 2500
      })
      setLoading(false)
      return
      
      // Закомментируем реальный API запрос для отладки
      /*
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${initData}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки профиля')
      }
      
      const result: ApiResponse<UserProfile> = await response.json()
      
      if (result.success) {
        setProfile(result.data)
      } else {
        throw new Error(result.error || 'Ошибка загрузки профиля')
      }
      */
    } catch (err) {
      console.error('Ошибка в fetchProfile:', err)
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (data: UpdateProfileData) => {
    try {
      setLoading(true)
      setError(null)
      
      // Временно всегда используем тестовые данные
      console.log('Имитируем обновление профиля')
      if (profile) {
        setProfile({
          ...profile,
          ...data
        })
      }
      setLoading(false)
      return true
      
      // Закомментируем реальный API запрос
      /*
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${initData}`
        },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        throw new Error('Ошибка обновления профиля')
      }
      
      const result: ApiResponse<UserProfile> = await response.json()
      
      if (result.success) {
        setProfile(result.data)
        return true
      } else {
        throw new Error(result.error || 'Ошибка обновления профиля')
      }
      */
    } catch (err) {
      console.error('Ошибка в updateProfile:', err)
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
      return false
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch: fetchProfile
  }
} 