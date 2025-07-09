#!/bin/bash

# 🚀 Быстрый деплой на Яндекс.Облако
# Использование: ./scripts/deploy-fast.sh

echo "🚀 Начинаем быстрый деплой..."

# Конфигурация
SERVER_IP="158.160.177.251"
SERVER_USER="ubuntu"
SSH_KEY="$HOME/.ssh/aero_lunch_key"
SERVER_PATH="/home/ubuntu/aero-lunch-app/dist"

# Проверяем, что мы в нужной папке
if [ ! -f "package.json" ]; then
    echo "❌ Запустите скрипт из корня проекта"
    exit 1
fi

# 1. Собираем проект
echo "📦 Собираем проект..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Ошибка сборки проекта"
    exit 1
fi

# 2. Загружаем файлы на сервер
echo "📤 Загружаем файлы на сервер..."
scp -i $SSH_KEY -r dist/* $SERVER_USER@$SERVER_IP:$SERVER_PATH/

if [ $? -ne 0 ]; then
    echo "❌ Ошибка загрузки файлов"
    exit 1
fi

# 3. Перезапускаем сервер (опционально)
echo "🔄 Перезапускаем веб-сервер..."
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP "sudo pkill -f 'python3 -m http.server' && cd $SERVER_PATH && sudo python3 -m http.server 80 > /dev/null 2>&1 &"

echo ""
echo "✅ Деплой успешно завершен!"
echo "📱 Откройте приложение: http://$SERVER_IP"
echo ""
echo "💡 Если видите старую версию - очистите кеш браузера (Ctrl+F5)" 