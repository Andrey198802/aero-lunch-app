#!/bin/bash

# 🚀 Скрипт для обновления продакшен сервера
# Использование: ./update-production.sh

echo "🚀 Обновляем продакшен сервер..."

# Проверяем SSH подключение
if ! ssh -i ~/.ssh/aero_lunch_key ubuntu@158.160.177.251 "echo 'SSH OK'"; then
    echo "❌ Ошибка SSH подключения"
    exit 1
fi

# Запускаем автоматическое обновление
echo "🔄 Запускаем автоматическое обновление..."
ssh -i ~/.ssh/aero_lunch_key ubuntu@158.160.177.251 "/home/ubuntu/aero-lunch-app/auto-update.sh"

# Проверяем что сервер работает
echo "🧪 Проверяем сервер..."
sleep 5
if curl -s "https://aero-lunch.ru/api/admin/stats" -H "x-admin-password: admin123" | grep -q "todayOrders"; then
    echo "✅ Сервер работает!"
    echo "🌐 Проверьте: https://aero-lunch.ru"
else
    echo "⚠️ Сервер может не работать"
fi

echo "🎉 Готово!" 