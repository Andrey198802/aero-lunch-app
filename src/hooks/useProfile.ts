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
      
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${window.Telegram?.WebApp?.initData || ''}`
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
      
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${window.Telegram?.WebApp?.initData || ''}`
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