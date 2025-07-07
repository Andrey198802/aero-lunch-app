import * as crypto from 'crypto';

/**
 * Валидация данных Telegram Web App
 * @param initData - данные инициализации от Telegram
 * @returns true если данные валидны
 */
export function validateTelegramWebAppData(initData: string): boolean {
  try {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!BOT_TOKEN) {
      console.error('TELEGRAM_BOT_TOKEN не установлен');
      return false;
    }

    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    
    if (!hash) {
      return false;
    }

    // Удаляем hash из параметров
    urlParams.delete('hash');

    // Сортируем параметры и создаем строку для проверки
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Создаем секретный ключ
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(BOT_TOKEN)
      .digest();

    // Вычисляем хеш
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    // Проверяем время (данные должны быть не старше 24 часов)
    const authDate = urlParams.get('auth_date');
    if (authDate) {
      const authTime = parseInt(authDate, 10);
      const currentTime = Math.floor(Date.now() / 1000);
      const timeDiff = currentTime - authTime;
      
      // 24 часа = 86400 секунд
      if (timeDiff > 86400) {
        console.error('Данные авторизации устарели');
        return false;
      }
    }

    return calculatedHash === hash;
  } catch (error) {
    console.error('Ошибка валидации данных Telegram:', error);
    return false;
  }
}

/**
 * Парсинг данных пользователя из initData
 * @param initData - данные инициализации от Telegram
 * @returns объект с данными пользователя или null
 */
export function parseTelegramUser(initData: string): any | null {
  try {
    const urlParams = new URLSearchParams(initData);
    const userJson = urlParams.get('user');
    
    if (!userJson) {
      return null;
    }

    return JSON.parse(userJson);
  } catch (error) {
    console.error('Ошибка парсинга данных пользователя:', error);
    return null;
  }
}

/**
 * Интерфейс для данных пользователя Telegram
 */
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
  allows_write_to_pm?: boolean;
} 