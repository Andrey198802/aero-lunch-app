#!/bin/bash

# 🚀 Супер быстрый деплой - просто запустите и все!
# Использование: ./quick-deploy.sh

echo "🚀 Быстрый деплой Aero Lunch..."

# Автоматически генерируем commit message
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
COMMIT_MESSAGE="Обновление от $TIMESTAMP"

# Запускаем основной скрипт деплоя
./deploy.sh "$COMMIT_MESSAGE" 