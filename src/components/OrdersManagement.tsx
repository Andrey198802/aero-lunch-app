import React, { useState, useEffect } from 'react'

interface Order {
  id: number
  orderNumber: string
  customerName: string
  totalAmount: number
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'
  createdAt: string
  updatedAt: string
  items: Array<{
    id: number
    name: string
    quantity: number
    price: number
  }>
  deliveryType: 'ONBOARD' | 'TAKEAWAY'
  flightNumber?: string
  phone?: string
  notes?: string
}

interface OrdersStats {
  todayOrders: number
  activeUsers: number
  todayRevenue: number
}

interface OrdersManagementProps {
  onBack: () => void
}

export const OrdersManagement: React.FC<OrdersManagementProps> = ({ onBack }) => {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrdersStats>({
    todayOrders: 0,
    activeUsers: 0,
    todayRevenue: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    fetchOrders()
    fetchStats()
  }, [])

  const fetchOrders = async () => {
    try {
      const initData = window.Telegram?.WebApp?.initData
      const response = await fetch('/api/admin/orders', {
        headers: {
          'x-telegram-init-data': initData || ''
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const initData = window.Telegram?.WebApp?.initData
      const response = await fetch('/api/admin/stats', {
        headers: {
          'x-telegram-init-data': initData || ''
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error)
    }
  }

  const updateOrderStatus = async (orderId: number, newStatus: Order['status']) => {
    try {
      const initData = window.Telegram?.WebApp?.initData
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': initData || ''
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        // Обновляем локальный список заказов
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
              : order
          )
        )
        
        // Обновляем выбранный заказ если он открыт
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null)
        }
      }
    } catch (error) {
      console.error('Ошибка обновления статуса:', error)
    }
  }

  const getFilteredOrders = () => {
    switch (activeTab) {
      case 'pending':
        return orders.filter(order => ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(order.status))
      case 'completed':
        return orders.filter(order => ['DELIVERED', 'CANCELLED'].includes(order.status))
      default:
        return orders
    }
  }

  const getStatusText = (status: Order['status']) => {
    const statusMap = {
      'PENDING': 'Ожидает',
      'CONFIRMED': 'Подтвержден',
      'PREPARING': 'Готовится',
      'READY': 'Готов',
      'DELIVERED': 'Доставлен',
      'CANCELLED': 'Отменен'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: Order['status']) => {
    const colorMap = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'CONFIRMED': 'bg-blue-100 text-blue-800',
      'PREPARING': 'bg-orange-100 text-orange-800',
      'READY': 'bg-green-100 text-green-800',
      'DELIVERED': 'bg-gray-100 text-gray-800',
      'CANCELLED': 'bg-red-100 text-red-800'
    }
    return colorMap[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusActions = (order: Order) => {
    const actions = []
    
    switch (order.status) {
      case 'PENDING':
        actions.push(
          <button
            key="confirm"
            onClick={() => updateOrderStatus(order.id, 'CONFIRMED')}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Подтвердить
          </button>
        )
        actions.push(
          <button
            key="cancel"
            onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Отменить
          </button>
        )
        break
      case 'CONFIRMED':
        actions.push(
          <button
            key="preparing"
            onClick={() => updateOrderStatus(order.id, 'PREPARING')}
            className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
          >
            В работу
          </button>
        )
        break
      case 'PREPARING':
        actions.push(
          <button
            key="ready"
            onClick={() => updateOrderStatus(order.id, 'READY')}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            Готов
          </button>
        )
        break
      case 'READY':
        actions.push(
          <button
            key="delivered"
            onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
            className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
          >
            Доставлен
          </button>
        )
        break
    }
    
    return actions
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка заказов...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Управление заказами</h1>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Быстрая статистика</h2>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.todayOrders}</div>
              <div className="text-sm text-gray-600">Заказов сегодня</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
              <div className="text-sm text-gray-600">Активных пользователей</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(stats.todayRevenue)}</div>
              <div className="text-sm text-gray-600">Выручка за день</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === 'all'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📋 Все заказы ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === 'pending'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              ⏳ Ожидающие ({orders.filter(o => ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(o.status)).length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === 'completed'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              ✅ Завершенные ({orders.filter(o => ['DELIVERED', 'CANCELLED'].includes(o.status)).length})
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {getFilteredOrders().length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Заказов нет</h3>
              <p className="text-gray-600">В выбранной категории пока нет заказов</p>
            </div>
          ) : (
            getFilteredOrders().map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="font-medium text-gray-900">
                        Заказ #{order.orderNumber.length > 8 ? `${order.orderNumber.substring(0, 8)}...` : order.orderNumber}
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{formatCurrency(order.totalAmount)}</div>
                      <div className="text-sm text-gray-500">{formatDate(order.createdAt)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-gray-600">Клиент:</span>
                      <span className="ml-2 font-medium">{order.customerName || 'Не указан'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Тип:</span>
                      <span className="ml-2 font-medium">
                        {order.deliveryType === 'ONBOARD' ? '✈️ На борт' : '🏃 Самовывоз'}
                      </span>
                    </div>
                    {order.flightNumber && (
                      <div>
                        <span className="text-gray-600">Рейс:</span>
                        <span className="ml-2 font-medium">{order.flightNumber}</span>
                      </div>
                    )}
                    {order.phone && (
                      <div>
                        <span className="text-gray-600">Телефон:</span>
                        <span className="ml-2 font-medium">{order.phone}</span>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <span className="text-gray-600 text-sm">Состав:</span>
                    <div className="mt-1 space-y-1">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.name} × {item.quantity}</span>
                          <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.notes && (
                    <div className="mb-4">
                      <span className="text-gray-600 text-sm">Примечания:</span>
                      <p className="text-sm text-gray-800 mt-1">{order.notes}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Обновлен: {formatDate(order.updatedAt)}
                    </div>
                    <div className="flex space-x-2">
                      {getStatusActions(order)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
} 