#!/bin/bash
echo "🚀 Обновляем сервер..."

# Проверяем доступность сервера
echo "📡 Проверяем сервер..."
curl -s "https://aero-lunch.ru/api/admin/stats" -H "x-admin-password: admin123" > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Сервер доступен"
else
    echo "❌ Сервер недоступен"
    exit 1
fi

# Пробуем разные способы обновления
echo "🔄 Пробуем обновить через API..."

# Способ 1: Прямой POST
curl -X POST -H "Content-Type: application/json" -H "x-admin-password: admin123" \
     -d '{"action":"update"}' "https://aero-lunch.ru/api/admin/update"

echo ""
echo "⏳ Ждем 30 секунд..."
sleep 30

# Проверяем результат
echo "🔍 Проверяем изменения..."
curl -X POST -H "Content-Type: application/json" \
     -d '{"items":[{"id":1,"title":"Тест скидки","price":1000,"quantity":1}],"deliveryType":"TAKEAWAY","notes":"Тест новой логики"}' \
     "https://aero-lunch.ru/api/orders/test"

echo ""
echo "✅ Готово!" 