import React, { useState, useEffect } from 'react'
import { useProfile } from '../hooks/useProfile'
import { useBonuses } from '../hooks/useBonuses'
import { useOrders } from '../hooks/useOrders'
import { UpdateProfileData, BonusHistoryItem, OrderHistoryItem } from '../types/telegram'
import { useTelegram } from '../hooks/useTelegram'

interface ProfilePageProps {
  onBack: () => void
}

// Компонент модального окна для отслеживания заказа
const OrderTrackingModal: React.FC<{
  order: OrderHistoryItem | null
  onClose: () => void
}> = ({ order, onClose }) => {
  if (!order) return null

  const getStatusSteps = () => {
    const allSteps = [
      { 
        key: 'PENDING', 
        title: 'В обработке', 
        description: 'Заказ принят и обрабатывается',
        icon: '📝'
      },
      { 
        key: 'CONFIRMED', 
        title: 'Подтвержден', 
        description: 'Заказ подтвержден и передан на кухню',
        icon: '✅'
      },
      { 
        key: 'PREPARING', 
        title: 'Готовим', 
        description: 'Ваш заказ готовится',
        icon: '👨‍🍳'
      },
      { 
        key: 'READY', 
        title: 'Готов', 
        description: 'Заказ готов к выдаче',
        icon: '🎉'
      },
      { 
        key: 'DELIVERED', 
        title: 'Доставлен', 
        description: 'Заказ успешно доставлен',
        icon: '🚚'
      }
    ]

    // Если заказ отменен, показываем только первый шаг + отмену
    if (order.status === 'CANCELLED') {
      return [
        allSteps[0],
        { 
          key: 'CANCELLED', 
          title: 'Отменен', 
          description: 'Заказ был отменен',
          icon: '❌'
        }
      ]
    }

    return allSteps
  }

  const getCurrentStepIndex = () => {
    const steps = getStatusSteps()
    return steps.findIndex(step => step.key === order.status)
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

  const steps = getStatusSteps()
  const currentStepIndex = getCurrentStepIndex()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Отслеживание заказа
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mt-2">
            <div className="font-medium text-gray-900">
              Заказ #{order.orderNumber.length > 20 ? `${order.orderNumber.substring(0, 8)}...` : order.orderNumber}
            </div>
            <div className="text-sm text-gray-600">
              {formatDate(order.createdAt)}
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-6">
          <div className="space-y-4">
            {steps.map((step, index) => {
              const isCompleted = index <= currentStepIndex
              const isCurrent = index === currentStepIndex
              const isCancelled = order.status === 'CANCELLED' && step.key === 'CANCELLED'
              
              return (
                <div key={step.key} className="flex items-start space-x-3">
                  {/* Icon/Status */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    isCancelled 
                      ? 'bg-red-100 text-red-600' 
                      : isCompleted 
                        ? 'bg-green-100 text-green-600' 
                        : isCurrent 
                          ? 'bg-blue-100 text-blue-600 animate-pulse' 
                          : 'bg-gray-100 text-gray-400'
                  }`}>
                    {isCancelled ? '❌' : isCompleted ? '✓' : step.icon}
                  </div>
                  
                  {/* Step Content */}
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium ${
                      isCancelled 
                        ? 'text-red-900' 
                        : isCompleted 
                          ? 'text-green-900' 
                          : isCurrent 
                            ? 'text-blue-900' 
                            : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                    <div className={`text-sm mt-1 ${
                      isCancelled 
                        ? 'text-red-600' 
                        : isCompleted 
                          ? 'text-green-600' 
                          : isCurrent 
                            ? 'text-blue-600' 
                            : 'text-gray-400'
                    }`}>
                      {step.description}
                    </div>
                    
                    {isCurrent && order.status !== 'CANCELLED' && (
                      <div className="text-xs text-blue-500 mt-1 font-medium">
                        Текущий этап
                      </div>
                    )}
                  </div>
                  
                  {/* Time */}
                  <div className="text-xs text-gray-500 flex-shrink-0">
                    {isCompleted && (
                      <div>
                        {formatDate(order.updatedAt)}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Order Details */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="text-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Сумма заказа:</span>
              <span className="font-medium text-gray-900">
                {order.totalAmount.toLocaleString('ru-RU')} ₽
              </span>
            </div>
            
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Позиций:</span>
              <span className="text-gray-900">
                {order.items.length} {order.items.length === 1 ? 'позиция' : 'позиций'}
              </span>
            </div>
            
            {order.bonusesUsed > 0 && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Использовано бонусов:</span>
                <span className="text-blue-600">-{order.bonusesUsed}</span>
              </div>
            )}
            
            {order.bonusesEarned > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Начислено бонусов:</span>
                <span className="text-green-600">+{order.bonusesEarned}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
  const { profile, loading: profileLoading, error: profileError, updateProfile } = useProfile()
  const { bonusHistory, loading: bonusLoading, hasMore: bonusHasMore, loadMore: loadMoreBonuses } = useBonuses()
  const { orderHistory, loading: orderLoading, hasMore: orderHasMore, loadMore: loadMoreOrders, getStatusText, getStatusColor } = useOrders()
  const { tg } = useTelegram()
  
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<UpdateProfileData>({})
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'bonuses' | 'orders'>('profile')
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null)
  const [trackingOrder, setTrackingOrder] = useState<OrderHistoryItem | null>(null)

  useEffect(() => {
    tg?.BackButton.show()
    tg?.BackButton.onClick(onBack)
    
    return () => {
      tg?.BackButton.hide()
      tg?.BackButton.offClick(onBack)
    }
  }, [tg, onBack])

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName,
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        email: profile.email || '',
        birthDate: profile.birthDate || ''
      })
    }
  }, [profile])

  const handleInputChange = (field: keyof UpdateProfileData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const success = await updateProfile(formData)
      if (success) {
        setEditing(false)
        tg?.HapticFeedback.notificationOccurred('success')
      }
    } catch (err) {
      tg?.HapticFeedback.notificationOccurred('error')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        firstName: profile.firstName,
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        email: profile.email || '',
        birthDate: profile.birthDate || ''
      })
    }
    setEditing(false)
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

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU')
  }

  const getBonusTypeText = (type: BonusHistoryItem['type']) => {
    const typeMap = {
      'EARNED': 'Начислено',
      'USED': 'Потрачено',
      'EXPIRED': 'Сгорело'
    }
    return typeMap[type] || type
  }

  const getBonusTypeColor = (type: BonusHistoryItem['type']) => {
    const colorMap = {
      'EARNED': 'text-green-600',
      'USED': 'text-blue-600',
      'EXPIRED': 'text-red-600'
    }
    return colorMap[type] || 'text-gray-600'
  }

  const getBonusTypeIcon = (type: BonusHistoryItem['type']) => {
    const iconMap = {
      'EARNED': '⬆️',
      'USED': '⬇️',
      'EXPIRED': '⏰'
    }
    return iconMap[type] || '•'
  }

  const formatBonusAmount = (amount: number, type: BonusHistoryItem['type']) => {
    const sign = type === 'EARNED' ? '+' : '-'
    return `${sign}${Math.abs(amount)}`
  }

  const getStatusIcon = (status: OrderHistoryItem['status']) => {
    const iconMap = {
      'PENDING': '⏳',
      'CONFIRMED': '✅',
      'PREPARING': '👨‍🍳',
      'READY': '🎉',
      'DELIVERED': '🚚',
      'CANCELLED': '❌'
    }
    return iconMap[status] || '📦'
  }

  const toggleOrderExpanded = (orderId: number) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId)
  }

  const showOrderTracking = (order: OrderHistoryItem) => {
    setTrackingOrder(order)
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка профиля...</p>
        </div>
      </div>
    )
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{profileError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm" style={{ backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', width: '100%' }}>
        <div className="px-4 py-4 flex items-center" style={{ padding: '16px', display: 'flex', alignItems: 'center', width: '100%' }}>
          <button
            onClick={onBack}
            className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            style={{ 
              marginRight: '16px', 
              padding: '12px', 
              borderRadius: '8px',
              backgroundColor: '#f3f4f6',
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '40px',
              minHeight: '40px'
            }}
          >
            <svg 
              className="w-6 h-6 text-gray-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ width: '20px', height: '20px', color: '#374151' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
            Личный кабинет
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Профиль
          </button>
          <button
            onClick={() => setActiveTab('bonuses')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 ${
              activeTab === 'bonuses'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Бонусы
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 ${
              activeTab === 'orders'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Заказы
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Основная информация */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Личные данные</h2>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Редактировать
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Имя
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.firstName || ''}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Введите имя"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Фамилия
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.lastName || ''}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Введите фамилию"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.lastName || 'Не указана'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Телефон
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+7 (999) 999-99-99"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.phone || 'Не указан'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  {editing ? (
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="example@email.com"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.email || 'Не указан'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Дата рождения
                  </label>
                  {editing ? (
                    <input
                      type="date"
                      value={formData.birthDate || ''}
                      onChange={(e) => handleInputChange('birthDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {profile.birthDate ? formatDateShort(profile.birthDate) : 'Не указана'}
                    </p>
                  )}
                </div>
              </div>

              {editing && (
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
                  >
                    Отмена
                  </button>
                </div>
              )}
            </div>

            {/* Статистика */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Статистика</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{profile.totalBonuses}</div>
                  <div className="text-sm text-gray-600">Бонусов</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{profile.totalOrders}</div>
                  <div className="text-sm text-gray-600">Заказов</div>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <div className="text-xl font-bold text-gray-900">
                  {profile.totalSpent.toLocaleString('ru-RU')} ₽
                </div>
                <div className="text-sm text-gray-600">Потрачено всего</div>
              </div>
              
              <div className="mt-4 text-center">
                <div className="text-sm text-gray-600">
                  С нами с {formatDateShort(profile.registrationDate)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bonuses Tab */}
        {activeTab === 'bonuses' && (
          <div className="space-y-6">
            {/* Баланс бонусов */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-sm p-6 text-white">
              <div className="text-center">
                <div className="text-sm opacity-90 mb-2">Доступно бонусов</div>
                <div className="text-4xl font-bold mb-2">
                  {profile.totalBonuses || 0}
                </div>
                <div className="text-sm opacity-90">
                  1 бонус = 1 рубль
                </div>
              </div>
            </div>

            {/* Информация о бонусах */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Как работают бонусы</h2>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="text-green-600 text-lg">💰</div>
                  <div>
                    <div className="font-medium text-gray-900">Начисление</div>
                    <div className="text-sm text-gray-600">
                      10% от суммы каждого заказа
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="text-blue-600 text-lg">🛒</div>
                  <div>
                    <div className="font-medium text-gray-900">Использование</div>
                    <div className="text-sm text-gray-600">
                      До 50% от суммы заказа
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="text-red-600 text-lg">⏰</div>
                  <div>
                    <div className="font-medium text-gray-900">Срок действия</div>
                    <div className="text-sm text-gray-600">
                      Бонусы действуют 1 год с момента начисления
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* История бонусов */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">История операций</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {bonusHistory.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500">
                    <div className="text-4xl mb-4">📝</div>
                    <p>История операций пуста</p>
                    <p className="text-sm mt-2">Сделайте первый заказ, чтобы получить бонусы</p>
                  </div>
                ) : (
                  bonusHistory.map((item) => (
                    <div key={item.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="text-lg">
                            {getBonusTypeIcon(item.type)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {getBonusTypeText(item.type)}
                            </div>
                            <div className="text-sm text-gray-600">
                              {item.description}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDate(item.createdAt)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`font-bold ${getBonusTypeColor(item.type)}`}>
                            {formatBonusAmount(item.amount, item.type)}
                          </div>
                          <div className="text-xs text-gray-500">
                            Баланс: {item.balanceAfter}
                          </div>
                        </div>
                      </div>
                      
                      {item.expiresAt && (
                        <div className="mt-2 text-xs text-orange-600">
                          Срок действия: {formatDate(item.expiresAt)}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              
              {bonusHasMore && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <button
                    onClick={loadMoreBonuses}
                    disabled={bonusLoading}
                    className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bonusLoading ? 'Загрузка...' : 'Загрузить ещё'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orderHistory.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <div className="text-4xl mb-4">🛒</div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  История заказов пуста
                </h2>
                <p className="text-gray-600">
                  Сделайте первый заказ, чтобы увидеть его здесь
                </p>
              </div>
            ) : (
              orderHistory.map((order) => (
                <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div 
                    className="px-6 py-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleOrderExpanded(order.id)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="text-lg flex-shrink-0">
                          {getStatusIcon(order.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            Заказ #{order.orderNumber.length > 20 ? `${order.orderNumber.substring(0, 8)}...` : order.orderNumber}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDate(order.createdAt)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-gray-900">
                          {order.totalAmount.toLocaleString('ru-RU')} ₽
                        </div>
                        <div className={`text-xs ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Краткая информация */}
                    <div className="mt-3 flex items-center justify-between text-sm text-gray-600">
                      <div>
                        {order.items.length} {order.items.length === 1 ? 'позиция' : 'позиций'}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2 text-xs">
                          {order.bonusesUsed > 0 && (
                            <div className="text-blue-600">
                              -{order.bonusesUsed}
                            </div>
                          )}
                          {order.bonusesEarned > 0 && (
                            <div className="text-green-600">
                              +{order.bonusesEarned}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            showOrderTracking(order)
                          }}
                          className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full hover:bg-blue-700 transition-colors"
                        >
                          Отследить
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Развернутая информация */}
                  {expandedOrder === order.id && (
                    <div className="border-t border-gray-200 px-6 py-4">
                      {/* Состав заказа */}
                      <div className="mb-4">
                        <h3 className="font-medium text-gray-900 mb-2">Состав заказа:</h3>
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                {item.imageUrl && (
                                  <img 
                                    src={item.imageUrl} 
                                    alt={item.name}
                                    className="w-10 h-10 object-cover rounded"
                                  />
                                )}
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {item.name}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {item.price.toLocaleString('ru-RU')} ₽ × {item.quantity}
                                  </div>
                                </div>
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Детали оплаты */}
                      <div className="border-t border-gray-200 pt-4">
                        <h3 className="font-medium text-gray-900 mb-2">Детали оплаты:</h3>
                        <div className="space-y-1 text-sm">
                          {(() => {
                            // Рассчитываем базовую сумму товаров
                            const itemsTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                            const discountAmount = order.promoDiscount || 0; // Это общая скидка (включая доставку)
                            const bonusesUsed = order.bonusesUsed || 0;
                            const finalAmount = order.totalAmount;
                            
                            return (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Сумма товаров:</span>
                                  <span className="text-gray-900">
                                    {itemsTotal.toLocaleString('ru-RU')} ₽
                                  </span>
                                </div>
                                
                                {discountAmount > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Скидка за доставку:</span>
                                    <span className="text-green-600">
                                      -{discountAmount.toLocaleString('ru-RU')} ₽
                                    </span>
                                  </div>
                                )}
                                
                                {order.promoCode && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Промокод "{order.promoCode}":</span>
                                    <span className="text-green-600">
                                      -{discountAmount.toLocaleString('ru-RU')} ₽
                                    </span>
                                  </div>
                                )}
                                
                                {bonusesUsed > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Бонусы:</span>
                                    <span className="text-blue-600">
                                      -{bonusesUsed.toLocaleString('ru-RU')} ₽
                                    </span>
                                  </div>
                                )}
                                
                                <div className="flex justify-between font-medium text-gray-900 border-t border-gray-200 pt-1">
                                  <span>К оплате:</span>
                                  <span>{finalAmount.toLocaleString('ru-RU')} ₽</span>
                                </div>
                                
                                {order.bonusesEarned > 0 && (
                                  <div className="flex justify-between text-green-600">
                                    <span>Начислено бонусов:</span>
                                    <span>+{order.bonusesEarned}</span>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      
                      {/* Время обновления */}
                      <div className="mt-4 text-xs text-gray-500">
                        Обновлено: {formatDate(order.updatedAt)}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            
            {orderHasMore && (
              <div className="pt-4">
                <button
                  onClick={loadMoreOrders}
                  disabled={orderLoading}
                  className="w-full py-3 px-4 bg-white text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {orderLoading ? 'Загрузка...' : 'Загрузить ещё'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Модальное окно для отслеживания заказа */}
      {trackingOrder && (
        <OrderTrackingModal
          order={trackingOrder}
          onClose={() => setTrackingOrder(null)}
        />
      )}
    </div>
  )
} 