#!/bin/bash

# 🚀 Быстрый деплой Aero Lunch
# Использование: ./deploy.sh "Описание изменений"

set -e

echo "🚀 Начинаем деплой Aero Lunch..."

# Проверяем параметры
if [ -z "$1" ]; then
    echo "❌ Укажите описание изменений!"
    echo "Использование: ./deploy.sh \"Описание изменений\""
    exit 1
fi

COMMIT_MESSAGE="$1"

# Собираем фронтенд
echo "📦 Собираем фронтенд..."
npm run build

# Коммитим и пушим
echo "📤 Отправляем изменения в Git..."
git add -A
git commit -m "$COMMIT_MESSAGE"
git push origin main

echo "⏳ Ждем автоматический деплой (30 секунд)..."
sleep 30

# Проверяем что деплой прошел
echo "🔍 Проверяем деплой..."
RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
    -d '{"items":[{"id":1,"title":"Тест деплоя","price":1000,"quantity":1}],"deliveryType":"TAKEAWAY"}' \
    "https://aero-lunch.ru/api/orders/test")

if echo "$RESPONSE" | grep -q "success"; then
    echo "✅ Деплой успешно завершен!"
    echo "🌐 Проверьте: https://aero-lunch.ru"
else
    echo "⚠️ Возможно есть проблемы с деплоем"
    echo "📋 Ответ сервера: $RESPONSE"
    echo "🔧 Попробуйте принудительный webhook:"
    echo "curl -X POST -H \"Content-Type: application/json\" -d '{\"ref\":\"refs/heads/main\",\"action\":\"deploy\"}' \"https://aero-lunch.ru/api/webhook\""
fi

echo "🎉 Готово!" 