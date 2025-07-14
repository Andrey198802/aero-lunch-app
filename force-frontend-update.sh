#!/bin/bash

echo "🚨 ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ ФРОНТЕНДА"

# Подключаемся к серверу и выполняем команды
ssh root@aero-lunch.ru << 'EOF'
cd /root/aero-lunch-app

echo "📥 Обновляем код..."
git pull origin main

echo "📦 Устанавливаем зависимости..."
npm install

echo "🔨 ПЕРЕСОБИРАЕМ ФРОНТЕНД..."
npm run build

echo "📁 Копируем файлы в nginx..."
sudo cp -r dist/* /usr/share/nginx/html/

echo "🔄 Перезапускаем nginx..."
sudo systemctl reload nginx

echo "✅ Проверяем файлы..."
ls -la /usr/share/nginx/html/

echo "🎉 ФРОНТЕНД ОБНОВЛЕН!"
EOF

echo "✅ Готово! Проверьте сайт." 