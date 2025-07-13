import React, { useState, useEffect } from 'react'

interface User {
  id: string
  telegramId: string
  firstName: string
  lastName?: string
  username?: string
  phone?: string
  email?: string
  totalBonuses: number
  totalOrders: number
  totalSpent: number
  registrationDate: string
  lastActive: string
  createdAt: string
}

interface UserDetails extends User {
  orders: any[]
  bonusHistory: any[]
}

interface UsersManagementProps {
  onBack: () => void
}

export const UsersManagement: React.FC<UsersManagementProps> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [showBonusModal, setShowBonusModal] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [bonusAmount, setBonusAmount] = useState('')
  const [bonusType, setBonusType] = useState<'EARNED' | 'USED'>('EARNED')
  const [bonusDescription, setBonusDescription] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Загрузка списка пользователей
  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users?search=${search}`, {
        headers: {
          'x-admin-password': 'admin123'
        }
      })
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки пользователей')
      }
      
      const data = await response.json()
      const safeUsers = (data.users || []).map((user: any) => ({
        ...user,
        totalBonuses: Number(user.totalBonuses) || 0,
        totalOrders: Number(user.totalOrders) || 0,
        totalSpent: Number(user.totalSpent) || 0
      }))
      setUsers(safeUsers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  // Загрузка деталей пользователя
  const loadUserDetails = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: {
          'x-admin-password': 'admin123'
        }
      })
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки пользователя')
      }
      
      const data = await response.json()
      const safeUser = {
        ...data.user,
        totalBonuses: Number(data.user.totalBonuses) || 0,
        totalOrders: Number(data.user.totalOrders) || 0,
        totalSpent: Number(data.user.totalSpent) || 0,
        orders: (data.user.orders || []).map((order: any) => ({
          ...order,
          totalAmount: Number(order.totalAmount) || 0
        }))
      }
      setSelectedUser(safeUser)
      setShowUserDetails(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки')
    }
  }

  // Управление бонусами
  const handleBonusAction = async () => {
    if (!selectedUser || !bonusAmount) return
    
    try {
      setActionLoading(true)
      const response = await fetch(`/api/admin/users/${selectedUser.id}/bonuses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': 'admin123'
        },
        body: JSON.stringify({
          amount: parseFloat(bonusAmount),
          type: bonusType,
          description: bonusDescription
        })
      })
      
      if (!response.ok) {
        throw new Error('Ошибка управления бонусами')
      }
      
      const data = await response.json()
      alert(data.message)
      
      // Обновляем данные пользователя
      await loadUserDetails(selectedUser.id)
      await loadUsers()
      
      setShowBonusModal(false)
      setBonusAmount('')
      setBonusDescription('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setActionLoading(false)
    }
  }

  // Блокировка пользователя
  const handleBlockUser = async (blocked: boolean) => {
    if (!selectedUser) return
    
    try {
      setActionLoading(true)
      const response = await fetch(`/api/admin/users/${selectedUser.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': 'admin123'
        },
        body: JSON.stringify({
          blocked,
          reason: blockReason
        })
      })
      
      if (!response.ok) {
        throw new Error('Ошибка изменения статуса')
      }
      
      const data = await response.json()
      alert(data.message)
      
      setShowBlockModal(false)
      setBlockReason('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setActionLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [search])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number | string | null | undefined) => {
    const numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount || 0))
    return `₽${(isNaN(numAmount) ? 0 : numAmount).toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка пользователей...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">⚠️</div>
          <p className="text-red-600 mb-4">{error}</p>
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

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                Управление пользователями
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Поиск по имени, username, телефону, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Users List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Пользователь
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Контакты
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статистика
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Последняя активность
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName || ''}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{user.username || 'нет username'}
                        </div>
                        <div className="text-xs text-gray-400">
                          ID: {user.telegramId}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.phone || 'Нет телефона'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.email || 'Нет email'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Заказов: {user.totalOrders}
                      </div>
                      <div className="text-sm text-gray-500">
                        Потрачено: {formatCurrency(user.totalSpent)}
                      </div>
                      <div className="text-sm text-blue-600">
                        Бонусы: {user.totalBonuses}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.lastActive)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => loadUserDetails(user.id)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Подробнее
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  {selectedUser.firstName} {selectedUser.lastName || ''}
                </h3>
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* User Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Telegram ID</p>
                  <p className="font-medium">{selectedUser.telegramId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Username</p>
                  <p className="font-medium">@{selectedUser.username || 'нет'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Телефон</p>
                  <p className="font-medium">{selectedUser.phone || 'Не указан'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedUser.email || 'Не указан'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Регистрация</p>
                  <p className="font-medium">{formatDate(selectedUser.registrationDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Последняя активность</p>
                  <p className="font-medium">{formatDate(selectedUser.lastActive)}</p>
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{selectedUser.totalOrders}</p>
                  <p className="text-sm text-gray-500">Заказов</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedUser.totalSpent)}</p>
                  <p className="text-sm text-gray-500">Потрачено</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{selectedUser.totalBonuses}</p>
                  <p className="text-sm text-gray-500">Бонусы</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 mb-6">
                <button
                  onClick={() => setShowBonusModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Управление бонусами
                </button>
                <button
                  onClick={() => setShowBlockModal(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Заблокировать
                </button>
              </div>

              {/* Recent Orders */}
              <div className="mb-4">
                <h4 className="text-md font-medium mb-2">Последние заказы</h4>
                <div className="space-y-2">
                  {selectedUser.orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-medium">#{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(order.totalAmount)}</p>
                        <p className="text-xs text-gray-500">{order.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bonus Management Modal */}
      {showBonusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Управление бонусами</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Действие
                  </label>
                  <select
                    value={bonusType}
                    onChange={(e) => setBonusType(e.target.value as 'EARNED' | 'USED')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EARNED">Начислить</option>
                    <option value="USED">Списать</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Количество бонусов
                  </label>
                  <input
                    type="number"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Введите количество"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Описание (необязательно)
                  </label>
                  <textarea
                    value={bonusDescription}
                    onChange={(e) => setBonusDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Причина начисления/списания"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowBonusModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Отмена
                </button>
                <button
                  onClick={handleBonusAction}
                  disabled={actionLoading || !bonusAmount}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Выполняется...' : 'Применить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block User Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Блокировка пользователя</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Причина блокировки
                  </label>
                  <textarea
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Укажите причину блокировки"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowBlockModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Отмена
                </button>
                <button
                  onClick={() => handleBlockUser(true)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Блокируется...' : 'Заблокировать'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 