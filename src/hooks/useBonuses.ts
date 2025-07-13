import { useState, useEffect } from 'react'
import { BonusHistoryItem, PaginatedResponse, ApiResponse } from '../types/telegram'

export const useBonuses = () => {
  const [bonusHistory, setBonusHistory] = useState<BonusHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [hasMore, setHasMore] = useState(true)

  const fetchBonusHistory = async (page: number = 1, append: boolean = false) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/user/bonus-history?page=${page}&limit=${pagination.limit}`, {
        headers: {
          'Authorization': `Bearer ${window.Telegram?.WebApp?.initData || ''}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки истории бонусов')
      }
      
      const result: ApiResponse<PaginatedResponse<BonusHistoryItem>> = await response.json()
      
      if (result.success) {
        const { data, pagination: paginationData } = result.data
        
        if (append) {
          setBonusHistory(prev => [...prev, ...data])
        } else {
          setBonusHistory(data)
        }
        
        setPagination(paginationData)
        setHasMore(paginationData.page < paginationData.totalPages)
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
      fetchBonusHistory(pagination.page + 1, true)
    }
  }

  const refresh = () => {
    fetchBonusHistory(1, false)
  }

  useEffect(() => {
    fetchBonusHistory()
  }, [])

  return {
    bonusHistory,
    loading,
    error,
    pagination,
    hasMore,
    loadMore,
    refresh
  }
} 