#!/bin/bash
# Скрипт для обновления Aero Lunch Bot на сервере
# Использование: ./deploy.sh

set -e  # Прекратить выполнение при ошибке

echo "🚀 Начинаем обновление Aero Lunch Bot..."

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

# Проверяем SSH подключение
SSH_KEY="$HOME/.ssh/aero_lunch_key"
SERVER_USER="ubuntu"
SERVER_IP="158.160.177.251"
SERVER_PATH="/home/ubuntu/aero-lunch-app"

if [ ! -f "$SSH_KEY" ]; then
    error "SSH ключ не найден: $SSH_KEY"
fi

log "Подключаемся к серверу..."

# Выполняем команды на сервере
ssh -i "$SSH_KEY" "$SERVER_USER@$SERVER_IP" << 'EOF'
    set -e
    
    # Переходим в папку проекта
    cd /home/ubuntu/aero-lunch-app
    
    echo "📥 Получаем последние изменения..."
    git stash || true
    git pull origin main
    
    echo "📦 Устанавливаем зависимости фронтенда..."
    npm install
    
    echo "🔨 Собираем фронтенд..."
    npm run build
    
    echo "📦 Устанавливаем зависимости бэкенда..."
    cd server
    npm install
    
    echo "🗃️ Обновляем базу данных..."
    npx prisma generate
    npx prisma db push
    
    echo "🔄 Перезапускаем сервисы..."
    sudo systemctl restart aero-lunch
    
    echo "✅ Проверяем статус сервиса..."
    sudo systemctl status aero-lunch --no-pager
    
    echo "🎉 Обновление завершено!"
EOF

log "Деплой завершен успешно!"
log "Проверьте бота: https://t.me/aero_lunch_bot" 