#!/bin/bash
# Скрипт для быстрого обновления Aero Lunch Bot
# Скопируйте и выполните эту команду на сервере

cd /root/food-telegram-app && \
git pull origin main && \
npm install && \
npm run build && \
cd server && \
npm install && \
npx prisma generate && \
npx prisma db push && \
pm2 restart frontend && \
pm2 restart backend && \
pm2 status && \
echo "🎉 Обновление завершено! Личный кабинет добавлен в бота." 