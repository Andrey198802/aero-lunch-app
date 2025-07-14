import { useState, useEffect } from 'react'
import { OrderHistoryItem } from '../types/telegram'

export const useOrders = () => {
  const [orderHistory, setOrderHistory] = useState<OrderHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const fetchOrders = async (pageNum: number = 1) => {
    try {
      setLoading(true)
      setError(null)
      
      // Получаем данные авторизации
      const initData = window.Telegram?.WebApp?.initData || ''
      const user = window.Telegram?.WebApp?.initDataUnsafe?.user
      
      console.log('=== ОТЛАДКА ЗАКАЗОВ ===')
      console.log('initData:', initData)
      console.log('user:', user)
      
      // Если есть данные Telegram, пробуем загрузить заказы с сервера
      if (user && initData) {
        console.log('Загружаем заказы с сервера')
        try {
          const response = await fetch(`/api/user/orders?page=${pageNum}&limit=10`, {
            headers: {
              'x-telegram-init-data': initData
            }
          })
          
          if (response.ok) {
            const result = await response.json()
            console.log('Заказы получены с сервера:', result)
            
            // Преобразуем данные сервера в формат фронтенда
            const orders = result.orders || []
            const transformedOrders: OrderHistoryItem[] = orders.map((order: any) => ({
              id: order.id,
              orderNumber: order.orderNumber || order.id,
              status: order.status,
              totalAmount: Number(order.totalAmount),
              bonusesUsed: Number(order.bonusesUsed) || 0,
              bonusesEarned: Number(order.bonusesEarned) || 0,
              promoCode: order.promoCode || undefined,
              promoDiscount: Number(order.discountAmount) || undefined,
              items: JSON.parse(order.items || '[]').map((item: any) => ({
                id: item.id,
                name: item.title || item.name,
                price: item.price,
                quantity: item.quantity,
                imageUrl: item.imageUrl || '/logo_aero1.svg'
              })),
              createdAt: order.createdAt,
              updatedAt: order.updatedAt
            }))
            
            if (pageNum === 1) {
              setOrderHistory(transformedOrders)
            } else {
              setOrderHistory(prev => [...prev, ...transformedOrders])
            }
            
            // Проверяем есть ли еще страницы
            const pagination = result.pagination
            setHasMore(pagination ? pagination.page < pagination.totalPages : false)
            
            setLoading(false)
            return
          } else {
            console.log('Ошибка загрузки заказов с сервера, используем тестовые данные')
          }
        } catch (apiError) {
          console.error('Ошибка API заказов:', apiError)
          console.log('Используем тестовые данные как fallback')
        }
      }
      
      // Fallback: используем тестовые данные
      console.log('Используем тестовые данные для заказов')
      const testOrders: OrderHistoryItem[] = [
        {
          id: 1001,
          orderNumber: '101',
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
          orderNumber: '102',
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
    } catch (err) {
      console.error('Ошибка в fetchOrders:', err)
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchOrders(2)
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