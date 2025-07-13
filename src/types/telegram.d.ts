declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void
        expand: () => void
        close: () => void
        MainButton: {
          text: string
          color: string
          textColor: string
          isVisible: boolean
          isActive: boolean
          show: () => void
          hide: () => void
          onClick: (callback: () => void) => void
          offClick: (callback: () => void) => void
        }
        BackButton: {
          isVisible: boolean
          show: () => void
          hide: () => void
          onClick: (callback: () => void) => void
          offClick: (callback: () => void) => void
        }
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void
          selectionChanged: () => void
        }
        initData: string
        initDataUnsafe: {
          user?: {
            id: number
            is_bot: boolean
            first_name: string
            last_name?: string
            username?: string
            language_code?: string
            is_premium?: boolean
            photo_url?: string
          }
          chat?: {
            id: number
            type: 'private' | 'group' | 'supergroup' | 'channel'
            title?: string
            username?: string
            photo_url?: string
          }
          start_param?: string
          auth_date: number
          hash: string
        }
        colorScheme: 'light' | 'dark'
        themeParams: {
          bg_color: string
          text_color: string
          hint_color: string
          link_color: string
          button_color: string
          button_text_color: string
        }
        isExpanded: boolean
        viewportHeight: number
        viewportStableHeight: number
        headerColor: string
        backgroundColor: string
        onEvent: (eventType: string, eventHandler: () => void) => void
        offEvent: (eventType: string, eventHandler: () => void) => void
        sendData: (data: string) => void
        openLink: (url: string) => void
        openTelegramLink: (url: string) => void
        openInvoice: (url: string, callback?: (status: string) => void) => void
      }
    }
  }
}

export type TelegramUser = {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  photo_url?: string
}

export type TelegramChat = {
  id: number
  type: 'private' | 'group' | 'supergroup' | 'channel'
  title?: string
  username?: string
  photo_url?: string
} 

// Типы для личного кабинета
export type UserProfile = {
  id: number
  telegramId: number
  firstName: string
  lastName?: string
  username?: string
  phone?: string
  email?: string
  birthDate?: string
  registrationDate: string
  totalBonuses: number
  totalOrders: number
  totalSpent: number
}

export type BonusHistoryItem = {
  id: number
  amount: number
  type: 'EARNED' | 'USED' | 'EXPIRED'
  description: string
  orderId?: number
  balanceBefore: number
  balanceAfter: number
  expiresAt?: string
  createdAt: string
}

export type OrderHistoryItem = {
  id: number
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED'
  totalAmount: number
  bonusesUsed: number
  bonusesEarned: number
  promoCode?: string
  promoDiscount?: number
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

export type OrderItem = {
  id: number
  name: string
  price: number
  quantity: number
  imageUrl?: string
}

export type PaginatedResponse<T> = {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type ApiResponse<T> = {
  success: boolean
  data: T
  error?: string
}

export type UpdateProfileData = {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  birthDate?: string
}

export type PageType = 'landing' | 'menu' | 'cart' | 'checkout' | 'profile' | 'admin' 