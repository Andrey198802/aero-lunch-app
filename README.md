# 🍽️ Aero Lunch - Телеграм бот для заказа еды

Телеграм бот для корпоративного заказа еды с веб-интерфейсом.

## 🚀 Деплой на продакшен

```bash
./update-production.sh
```

Подробнее: [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md)

## 🛠️ Разработка

### Локальный запуск:
```bash
# Фронтенд
npm install
npm run dev

# Бэкенд
cd server
npm install
npm run dev
```

### Структура проекта:
- `src/` - React фронтенд
- `server/` - Node.js бэкенд
- `update-production.sh` - скрипт деплоя

## 📱 Функционал

- Просмотр меню и заказ еды
- Личный кабинет с историей заказов
- Админ панель для управления
- Система бонусов и скидок
- Интеграция с Telegram

## 🔧 Технологии

- Frontend: React + TypeScript + Tailwind
- Backend: Node.js + Express + Prisma
- Database: PostgreSQL
- Deploy: nginx + pm2 