#!/bin/bash

# 🚀 Скрипт быстрого деплоя для Aero Lunch
# Использование: ./scripts/quick-deploy.sh

set -e

echo "🚀 Начинаем быстрый деплой..."

# Проверяем, что мы в нужной папке
if [ ! -f "package.json" ]; then
    echo "❌ Запустите скрипт из корня проекта"
    exit 1
fi

# Функция для определения типа изменений
detect_changes() {
    if git diff --quiet HEAD~1 HEAD -- src/; then
        echo "frontend"
    elif git diff --quiet HEAD~1 HEAD -- server/; then
        echo "backend"
    else
        echo "both"
    fi
}

CHANGE_TYPE=$(detect_changes)
echo "📝 Тип изменений: $CHANGE_TYPE"

# Коммитим и пушим изменения
echo "📤 Отправляем изменения в Git..."
git add .
read -p "Введите описание изменений: " commit_message
git commit -m "$commit_message"
git push origin main

echo "⏱️ Ожидаем автоматический деплой..."
echo "🌐 Проверить статус: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/actions"

# Ждём завершения деплоя
sleep 30

# Проверяем, что сайт работает
echo "🔍 Проверяем сайт..."
if curl -s -o /dev/null -w "%{http_code}" https://your-domain.com | grep -q "200"; then
    echo "✅ Сайт работает!"
    echo "🎉 Деплой успешно завершён!"
else
    echo "⚠️ Проверьте логи деплоя"
fi

echo ""
echo "📱 Не забудьте протестировать в Telegram!"
echo "🔗 https://t.me/aero_lunch_bot" 