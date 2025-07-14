#!/bin/bash

# 🔄 Скрипт автоматического обновления Aero Lunch
set -e

echo "🔄 Начинаем автоматическое обновление..."

# Обновляем код
echo "📥 Обновляем код..."
git pull origin main

# Обновляем зависимости и пересобираем фронтенд
echo "📦 Обновляем зависимости..."
npm install

echo "🔨 ПРИНУДИТЕЛЬНО пересобираем фронтенд..."
npm run build

echo "📁 Копируем файлы в nginx..."
sudo cp -r dist/* /usr/share/nginx/html/

# Обновляем бэкенд
echo "🔧 Обновляем бэкенд..."
cd server
npm install

echo "🔄 Перезапускаем сервис..."
sudo systemctl restart aero-lunch-backend

echo "✅ Проверяем статус..."
sudo systemctl status aero-lunch-backend --no-pager

echo "🎉 Обновление завершено!" 