export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

declare global {
  namespace Express {
    interface Request {
      telegramUser?: TelegramUser;
    }
  }
} 