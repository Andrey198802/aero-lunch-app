import { useState, useEffect } from 'react'
import { OrderHistoryItem, PaginatedResponse, ApiResponse } from '../types/telegram'

export const useOrders = () => {
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const fetchOrders = async (pageNum: number = 1) => {
    try {
      setLoading(true)
      setError(null)
      
      // Получаем данные авторизации
      const initData = window.Telegram?.WebApp?.initData || ''
      
      // Если нет данных Telegram, создаем тестовые данные
      if (!initData || !window.Telegram?.WebApp?.initDataUnsafe?.user) {
        console.log('Нет данных Telegram, используем тестовые данные для заказов')
        const testOrders: OrderHistoryItem[] = [
          {
            id: 1001,
            status: 'DELIVERED',
            totalAmount: 890,
            bonusesUsed: 50,
            bonusesEarned: 25,
            promoCode: 'FIRST10',
            promoDiscount: 90,
            items: [
              {
                id: 1,
                name: 'Каша овсяная со свежими ягодами',
                price: 450,
                quantity: 1,
                imageUrl: '/logo_aero1.svg'
              },
              {
                id: 2,
                name: 'Каша пшённая с чатни из тыквы',
                price: 490,
                quantity: 1,
                imageUrl: '/logo_aero1.svg'
              }
            ],
            createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 день назад
            updatedAt: new Date(Date.now() - 86400000 + 3600000).toISOString() // 1 день назад + 1 час
          },
          {
            id: 1002,
            status: 'PREPARING',
            totalAmount: 650,
            bonusesUsed: 0,
            bonusesEarned: 30,
            items: [
              {
                id: 3,
                name: 'Сэндвич с авокадо',
                price: 350,
                quantity: 1,
                imageUrl: '/logo_aero1.svg'
              },
              {
                id: 4,
                name: 'Смузи ягодный',
                price: 300,
                quantity: 1,
                imageUrl: '/logo_aero1.svg'
              }
            ],
            createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 час назад
            updatedAt: new Date(Date.now() - 1800000).toISOString() // 30 минут назад
          }
        ]
        
        if (pageNum === 1) {
          setOrderHistory(testOrders)
        }
        setHasMore(false)
        setLoading(false)
        return
      }
      
      const response = await fetch(`/api/user/orders?page=${pageNum}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${initData}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки истории заказов')
      }
      
      const result: ApiResponse<PaginatedResponse<OrderHistoryItem>> = await response.json()
      
      if (result.success) {
        const newOrders = result.data.data
        
        if (pageNum === 1) {
          setOrderHistory(newOrders)
        } else {
          setOrderHistory(prev => [...prev, ...newOrders])
        }
        
        setHasMore(result.data.pagination.page < result.data.pagination.totalPages)
        setPage(pageNum)
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
      fetchOrders(page + 1)
    }
  }

  const getStatusText = (status: OrderHistoryItem['status']) => {
    const statusMap = {
      'PENDING': 'Ожидает подтверждения',
      'CONFIRMED': 'Подтверждён',
      'PREPARING': 'Готовится',
      'READY': 'Готов к выдаче',
      'DELIVERED': 'Выдан',
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
    fetchOrders()
  }, [])

  return {
    orderHistory,
    loading,
    error,
    hasMore,
    loadMore,
    getStatusText,
    getStatusColor,
    refetch: () => fetchOrders(1)
  }
} 