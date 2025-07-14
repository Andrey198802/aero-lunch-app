#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Обновляем продакшен сервер...${NC}"

# Сначала пушим все изменения
echo -e "${YELLOW}📤 Пушим изменения на GitHub...${NC}"
if git diff --quiet && git diff --cached --quiet; then
    echo -e "${GREEN}✅ Нет изменений для коммита${NC}"
else
    echo -e "${RED}❌ Есть незакоммиченные изменения! Сначала сделайте commit.${NC}"
    echo -e "${YELLOW}Используйте: git add -A && git commit -m 'Ваше сообщение'${NC}"
    exit 1
fi

# Пушим на GitHub
git push origin main
echo -e "${GREEN}✅ Изменения отправлены на GitHub${NC}"

# Проверяем подключение к серверу
if ! ping -c 1 aero-lunch.ru &> /dev/null; then
    echo -e "${RED}❌ Сервер недоступен${NC}"
    exit 1
fi

echo -e "${GREEN}SSH OK${NC}"

# Выполняем команды на сервере
echo -e "${YELLOW}🔄 Запускаем автоматическое обновление...${NC}"

ssh -i ~/.ssh/aero_lunch_key ubuntu@aero-lunch.ru '
cd /home/ubuntu/aero-lunch-app

echo "🔄 Начинаем автоматическое обновление..."

echo "📥 Обновляем код..."
git pull origin main

echo "📦 Обновляем зависимости..."
npm ci

echo "🔨 ПЕРЕСОБИРАЕМ ФРОНТЕНД..."
npm run build

echo "📁 Копируем фронтенд в nginx..."
sudo cp -r dist/* /usr/share/nginx/html/

echo "🔧 Обновляем бэкенд..."
cd server
npm ci

echo "🔄 Перезапускаем сервис..."
sudo systemctl restart aero-lunch-backend

echo "✅ Проверяем статус..."
sudo systemctl status aero-lunch-backend --no-pager

echo "🎉 Обновление завершено!"
'

echo -e "${YELLOW}🧪 Проверяем сервер...${NC}"
if curl -f https://aero-lunch.ru > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Сервер работает!${NC}"
    echo -e "${BLUE}🌐 Проверьте: https://aero-lunch.ru${NC}"
else
    echo -e "${RED}⚠️ Сервер может не работать${NC}"
fi

echo -e "${GREEN}🎉 Готово!${NC}" 