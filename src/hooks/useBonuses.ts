import { useState, useEffect } from 'react'
import { BonusHistoryItem, PaginatedResponse, ApiResponse } from '../types/telegram'

export const useBonuses = () => {
  const [bonusHistory, setBonusHistory] = useState<BonusHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchBonuses = async (pageNum: number = 1) => {
    try {
      setLoading(true)
      setError(null)
      
      // Получаем данные авторизации
      const initData = window.Telegram?.WebApp?.initData || ''
      
      // Если нет данных Telegram, создаем тестовые данные
      if (!initData || !window.Telegram?.WebApp?.initDataUnsafe?.user) {
        console.log('Нет данных Telegram, используем тестовые данные для бонусов')
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
        return
      }
      
      const response = await fetch(`/api/user/bonuses?page=${pageNum}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${initData}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки истории бонусов')
      }
      
      const result: ApiResponse<PaginatedResponse<BonusHistoryItem>> = await response.json()
      
      if (result.success) {
        const newBonuses = result.data.data
        
        if (pageNum === 1) {
          setBonusHistory(newBonuses)
        } else {
          setBonusHistory(prev => [...prev, ...newBonuses])
        }
        
        setHasMore(result.data.pagination.page < result.data.pagination.totalPages)
        setPage(pageNum)
      } else {
        throw new Error(result.error || 'Ошибка загрузки истории бонусов')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchBonuses(page + 1)
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