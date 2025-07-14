#!/bin/bash

# 🔄 Скрипт автоматического обновления Aero Lunch
set -e

echo "🔄 Начинаем автоматическое обновление..."

# Переходим в папку проекта
cd /home/ubuntu/aero-lunch-app

# Останавливаем старые процессы
sudo pkill -f 'node.*server' || true
sudo pkill -f 'ts-node.*server' || true

# Обновляем код
echo "📥 Обновляем код..."
git pull origin main

# Обновляем зависимости
echo "📦 Обновляем зависимости..."
npm install

# Обновляем backend зависимости
cd server
npm install

# Перезапускаем сервис
echo "🔄 Перезапускаем сервис..."
sudo systemctl restart aero-lunch-backend
sudo systemctl enable aero-lunch-backend

# Проверяем статус
echo "✅ Проверяем статус..."
sudo systemctl status aero-lunch-backend --no-pager

echo "🎉 Обновление завершено!" 