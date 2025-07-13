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
      
      // Если есть данные пользователя Telegram, пробуем загрузить профиль с сервера
      if (user && initData) {
        console.log('Загружаем профиль с сервера')
        try {
          const response = await fetch('/api/user/profile', {
            headers: {
              'x-telegram-init-data': initData
            }
          })
          
          if (response.ok) {
            const serverProfile = await response.json()
            console.log('Профиль получен с сервера:', serverProfile)
            
            // Преобразуем данные сервера в формат фронтенда
            setProfile({
              id: serverProfile.id || 1,
              telegramId: user.id,
              firstName: serverProfile.firstName || user.first_name,
              lastName: serverProfile.lastName || user.last_name || '',
              username: serverProfile.username || user.username || '',
              phone: serverProfile.phone || '',
              email: serverProfile.email || '',
              birthDate: serverProfile.birthDate || '',
              registrationDate: serverProfile.registrationDate || new Date().toISOString(),
              totalBonuses: Number(serverProfile.totalBonuses) || 0,
              totalOrders: serverProfile.totalOrders || 0,
              totalSpent: Number(serverProfile.totalSpent) || 0
            })
            setLoading(false)
            return
          } else {
            console.log('Ошибка загрузки с сервера, используем данные Telegram')
          }
        } catch (apiError) {
          console.error('Ошибка API:', apiError)
          console.log('Используем данные Telegram как fallback')
        }
      }
      
      // Fallback: создаем профиль на основе данных Telegram
      if (user) {
        console.log('Создаем профиль на основе данных Telegram')
        setProfile({
          id: 1,
          telegramId: user.id,
          firstName: user.first_name,
          lastName: user.last_name || '',
          username: user.username || '',
          phone: '',
          email: '',
          birthDate: '',
          registrationDate: new Date().toISOString(),
          totalBonuses: 0,
          totalOrders: 0,
          totalSpent: 0
        })
        setLoading(false)
        return
      }
      
      // Последний fallback для тестирования без Telegram
      console.log('Используем тестовые данные (нет данных Telegram)')
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
      
      const initData = window.Telegram?.WebApp?.initData || ''
      
      // Если есть данные Telegram, пробуем обновить на сервере
      if (initData) {
        try {
          const response = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-telegram-init-data': initData
            },
            body: JSON.stringify(data)
          })
          
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.user) {
              // Обновляем профиль данными с сервера
              setProfile(prev => prev ? {
                ...prev,
                firstName: result.user.firstName || prev.firstName,
                lastName: result.user.lastName || prev.lastName,
                phone: result.user.phone || prev.phone,
                email: result.user.email || prev.email,
                birthDate: result.user.birthDate || prev.birthDate,
                totalBonuses: Number(result.user.totalBonuses) || prev.totalBonuses,
                totalOrders: result.user.totalOrders || prev.totalOrders,
                totalSpent: Number(result.user.totalSpent) || prev.totalSpent
              } : null)
              setLoading(false)
              return true
            }
          }
        } catch (apiError) {
          console.error('Ошибка API обновления:', apiError)
        }
      }
      
      // Fallback: обновляем локально
      console.log('Обновляем профиль локально:', data)
      if (profile) {
        setProfile({
          ...profile,
          ...data
        })
      }
      setLoading(false)
      return true
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