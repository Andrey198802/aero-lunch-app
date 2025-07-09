#!/bin/bash

# Простой деплой на сервер
echo "🚀 Начинаем загрузку на сервер..."

# Проверяем, что мы в нужной папке
if [ ! -f "package.json" ]; then
    echo "❌ Запустите скрипт из корня проекта"
    exit 1
fi

# Собираем проект
echo "📦 Собираем проект..."
npm run build

# Загружаем на сервер
echo "📤 Загружаем файлы на сервер..."
echo ""
echo "⚠️  Для загрузки нужны данные сервера:"
echo ""
read -p "Введите IP адрес сервера: " SERVER_IP
read -p "Введите имя пользователя (обычно ubuntu): " SERVER_USER
read -p "Введите путь на сервере (например /home/ubuntu/aero-lunch): " SERVER_PATH

# Загружаем файлы через SCP
echo ""
echo "🔄 Загружаем файлы..."
scp -r dist/* $SERVER_USER@$SERVER_IP:$SERVER_PATH/dist/

echo ""
echo "✅ Файлы загружены!"
echo ""
echo "📱 Теперь вы можете открыть приложение по адресу:"
echo "   http://$SERVER_IP"
echo ""
echo "🎉 Готово!" 