#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Обновление Aero Lunch Bot на сервере...${NC}"

# Проверяем подключение к серверу
echo -e "${YELLOW}📡 Проверяем подключение к серверу...${NC}"
if ! ping -c 1 194.87.239.8 &> /dev/null; then
    echo -e "${RED}❌ Сервер недоступен${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Сервер доступен${NC}"

# Выполняем команды на сервере
echo -e "${YELLOW}📥 Обновляем код на сервере...${NC}"

ssh root@194.87.239.8 << 'ENDSSH'
cd /root/food-telegram-app

echo "🔄 Получаем последние изменения..."
git pull origin main

echo "📦 Обновляем зависимости фронтенда..."
npm install
npm run build

echo "🔧 Обновляем бэкенд..."
cd server
npm install
npx prisma generate

echo "🔄 Перезапускаем сервисы..."
pm2 restart frontend
pm2 restart backend

echo "📊 Статус сервисов:"
pm2 status

echo "✅ Обновление завершено!"
ENDSSH

echo -e "${GREEN}🎉 Обновление завершено успешно!${NC}"
echo -e "${BLUE}📱 Теперь можно тестировать бота в Telegram${NC}"
echo -e "${YELLOW}👤 Нажмите на иконку профиля в header для доступа к личному кабинету${NC}" 