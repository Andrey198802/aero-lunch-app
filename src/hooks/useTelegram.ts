import { useEffect, useState } from 'react'
import type { TelegramUser, TelegramChat } from '../types/telegram'

export function useTelegram() {
  const [tg] = useState(() => window.Telegram?.WebApp)
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [chat, setChat] = useState<TelegramChat | null>(null)

  useEffect(() => {
    if (tg) {
      const initData = tg.initDataUnsafe
      
      if (initData.user) {
        setUser(initData.user)
      }
      
      if (initData.chat) {
        setChat(initData.chat)
      }

      // Настройка темы
      if (tg.colorScheme === 'dark') {
        tg.headerColor = '#1a1a1a'
        tg.backgroundColor = '#1a1a1a'
      }
    }
  }, [tg])

  const showMainButton = (text: string, onClick: () => void) => {
    if (tg?.MainButton) {
      tg.MainButton.text = text
      tg.MainButton.color = '#d1b954'
      tg.MainButton.textColor = '#1a1a1a'
      tg.MainButton.show()
      tg.MainButton.onClick(onClick)
    }
  }

  const hideMainButton = () => {
    if (tg?.MainButton) {
      tg.MainButton.hide()
    }
  }

  const showBackButton = (onClick: () => void) => {
    if (tg?.BackButton) {
      tg.BackButton.show()
      tg.BackButton.onClick(onClick)
    }
  }

  const hideBackButton = () => {
    if (tg?.BackButton) {
      tg.BackButton.hide()
    }
  }

  const hapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning') => {
    if (tg?.HapticFeedback) {
      if (type === 'success' || type === 'error' || type === 'warning') {
        tg.HapticFeedback.notificationOccurred(type)
      } else {
        tg.HapticFeedback.impactOccurred(type)
      }
    }
  }

  const close = () => {
    if (tg) {
      tg.close()
    }
  }

  const sendData = (data: object) => {
    if (tg) {
      tg.sendData(JSON.stringify(data))
    }
  }

  return {
    tg,
    user,
    chat,
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
    hapticFeedback,
    close,
    sendData,
  }
} 