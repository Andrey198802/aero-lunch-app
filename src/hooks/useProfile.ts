import { useState, useEffect } from 'react'
import { UserProfile, UpdateProfileData, ApiResponse } from '../types/telegram'

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
      
      // Если нет данных Telegram, создаем тестовые данные
      if (!initData || !window.Telegram?.WebApp?.initDataUnsafe?.user) {
        console.log('Нет данных Telegram, используем тестовые данные')
        setProfile({
          id: 1,
          telegramId: 123456789,
          firstName: 'Тестовый',
          lastName: 'Пользователь',
          username: 'testuser',
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
      }
      
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (data: UpdateProfileData) => {
    try {
      setLoading(true)
      setError(null)
      
      // Получаем данные авторизации
      const initData = window.Telegram?.WebApp?.initData || ''
      
      // Если нет данных Telegram, имитируем успешное обновление
      if (!initData || !window.Telegram?.WebApp?.initDataUnsafe?.user) {
        console.log('Нет данных Telegram, имитируем обновление профиля')
        if (profile) {
          setProfile({
            ...profile,
            ...data
          })
        }
        setLoading(false)
        return true
      }
      
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
    } catch (err) {
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