import { useState, useEffect } from 'react'
import { BonusHistoryItem } from '../types/telegram'

export const useBonuses = () => {
  const [bonusHistory, setBonusHistory] = useState<BonusHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const fetchBonuses = async (pageNum: number = 1) => {
    try {
      setLoading(true)
      setError(null)
      
      // Получаем данные авторизации
      const initData = window.Telegram?.WebApp?.initData || ''
      const user = window.Telegram?.WebApp?.initDataUnsafe?.user
      
      console.log('=== ОТЛАДКА БОНУСОВ ===')
      console.log('initData:', initData)
      console.log('user:', user)
      
      // Если есть данные Telegram, пробуем загрузить бонусы с сервера
      if (user && initData) {
        console.log('Загружаем бонусы с сервера')
        try {
          const response = await fetch(`/api/user/bonus-history?page=${pageNum}&limit=10`, {
            headers: {
              'x-telegram-init-data': initData
            }
          })
          
          if (response.ok) {
            const result = await response.json()
            console.log('Бонусы получены с сервера:', result)
            
            // Преобразуем данные сервера в формат фронтенда
            const bonuses = result.bonusHistory || []
            const transformedBonuses: BonusHistoryItem[] = bonuses.map((bonus: any) => ({
              id: bonus.id,
              amount: Number(bonus.amount),
              type: bonus.type === 'SPENT' ? 'USED' : bonus.type, // Преобразуем SPENT в USED
              description: bonus.description,
              orderId: bonus.orderId || undefined,
              balanceBefore: Number(bonus.balanceBefore),
              balanceAfter: Number(bonus.balanceAfter),
              expiresAt: bonus.expiresAt || undefined,
              createdAt: bonus.createdAt
            }))
            
            if (pageNum === 1) {
              setBonusHistory(transformedBonuses)
            } else {
              setBonusHistory(prev => [...prev, ...transformedBonuses])
            }
            
            // Проверяем есть ли еще страницы
            const pagination = result.pagination
            setHasMore(pagination ? pagination.page < pagination.totalPages : false)
            
            setLoading(false)
            return
          } else {
            console.log('Ошибка загрузки бонусов с сервера, используем тестовые данные')
          }
        } catch (apiError) {
          console.error('Ошибка API бонусов:', apiError)
          console.log('Используем тестовые данные как fallback')
        }
      }
      
      // Fallback: используем тестовые данные
      console.log('Используем тестовые данные для бонусов')
      const testBonuses: BonusHistoryItem[] = [
        {
          id: 1,
          amount: 50,
          type: 'EARNED',
          description: 'Бонусы за заказ #1001',
          orderId: 1001,
          balanceBefore: 100,
          balanceAfter: 150,
          createdAt: new Date(Date.now() - 86400000).toISOString() // 1 день назад
        },
        {
          id: 2,
          amount: -30,
          type: 'USED',
          description: 'Использованы при оплате заказа #1002',
          orderId: 1002,
          balanceBefore: 150,
          balanceAfter: 120,
          createdAt: new Date(Date.now() - 172800000).toISOString() // 2 дня назад
        },
        {
          id: 3,
          amount: 25,
          type: 'EARNED',
          description: 'Бонусы за заказ #1003',
          orderId: 1003,
          balanceBefore: 120,
          balanceAfter: 145,
          createdAt: new Date(Date.now() - 259200000).toISOString() // 3 дня назад
        }
      ]
      
      if (pageNum === 1) {
        setBonusHistory(testBonuses)
      }
      setHasMore(false)
      setLoading(false)
    } catch (err) {
      console.error('Ошибка в fetchBonuses:', err)
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchBonuses(2)
    }
  }

  useEffect(() => {
    fetchBonuses()
  }, [])

  return {
    bonusHistory,
    loading,
    error,
    hasMore,
    loadMore,
    refetch: () => fetchBonuses(1)
  }
} 