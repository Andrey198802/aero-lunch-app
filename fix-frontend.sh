#!/bin/bash

echo "🚨 ИСПРАВЛЯЕМ ФРОНТЕНД НА ПРОДАКШЕНЕ"

# Проверяем соединение
echo "📡 Проверяем соединение..."
if ! ping -c 1 aero-lunch.ru &> /dev/null; then
    echo "❌ Сервер недоступен"
    exit 1
fi

echo "✅ Сервер доступен"

# Выполняем команды на сервере
echo "🔧 Исправляем фронтенд..."

ssh root@aero-lunch.ru 'cd /root/aero-lunch-app && echo "📥 Обновляем код..." && git pull origin main && echo "📦 Устанавливаем зависимости..." && npm ci && echo "🔨 ПЕРЕСОБИРАЕМ ФРОНТЕНД..." && npm run build && echo "📁 Копируем в nginx..." && cp -r dist/* /usr/share/nginx/html/ && echo "🔄 Перезагружаем nginx..." && systemctl reload nginx && echo "✅ Проверяем результат..." && ls -la /usr/share/nginx/html/index.html && echo "🎉 ГОТОВО!"'

echo "✅ Фронтенд исправлен! Проверьте https://aero-lunch.ru" 