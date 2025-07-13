import { useState, useEffect } from 'react'
import { OrderHistoryItem, PaginatedResponse, ApiResponse } from '../types/telegram'

export const useOrders = () => {
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  const [hasMore, setHasMore] = useState(true)

  const fetchOrderHistory = async (page: number = 1, append: boolean = false) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/user/orders?page=${page}&limit=${pagination.limit}`, {
        headers: {
          'Authorization': `Bearer ${window.Telegram?.WebApp?.initData || ''}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки истории заказов')
      }
      
      const result: ApiResponse<PaginatedResponse<OrderHistoryItem>> = await response.json()
      
      if (result.success) {
        const { data, pagination: paginationData } = result.data
        
        if (append) {
          setOrderHistory(prev => [...prev, ...data])
        } else {
          setOrderHistory(data)
        }
        
        setPagination(paginationData)
        setHasMore(paginationData.page < paginationData.totalPages)
      } else {
        throw new Error(result.error || 'Ошибка загрузки истории заказов')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchOrderHistory(pagination.page + 1, true)
    }
  }

  const refresh = () => {
    fetchOrderHistory(1, false)
  }

  const getStatusText = (status: OrderHistoryItem['status']) => {
    const statusMap = {
      'PENDING': 'Ожидает подтверждения',
      'CONFIRMED': 'Подтверждён',
      'PREPARING': 'Готовится',
      'READY': 'Готов',
      'DELIVERED': 'Доставлен',
      'CANCELLED': 'Отменён'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: OrderHistoryItem['status']) => {
    const colorMap = {
      'PENDING': 'text-yellow-600',
      'CONFIRMED': 'text-blue-600',
      'PREPARING': 'text-orange-600',
      'READY': 'text-green-600',
      'DELIVERED': 'text-green-700',
      'CANCELLED': 'text-red-600'
    }
    return colorMap[status] || 'text-gray-600'
  }

  useEffect(() => {
    fetchOrderHistory()
  }, [])

  return {
    orderHistory,
    loading,
    error,
    pagination,
    hasMore,
    loadMore,
    refresh,
    getStatusText,
    getStatusColor
  }
} 