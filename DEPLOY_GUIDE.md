# 🚀 Гид по деплою Aero Lunch

## Автоматический деплой (рекомендуется)

### Простой способ:
```bash
# 1. Делаем изменения в коде
# 2. Коммитим и пушим
git add -A
git commit -m "Описание изменений"
git push origin main

# 3. Автоматически запускается GitHub Actions
# 4. Webhook обновляет сервер
```

### Что происходит автоматически:
- ✅ GitHub Actions собирает фронтенд
- ✅ Отправляет webhook на сервер
- ✅ Сервер получает webhook и обновляется
- ✅ `git pull origin main` на сервере
- ✅ `npm run build` в папке server
- ✅ `pm2 restart aero-lunch-backend`

## Ручной деплой (если что-то сломалось)

### SSH доступ к серверу:
```bash
# Подключение к серверу
ssh -i ~/.ssh/aero_lunch_key ubuntu@158.160.177.251

# Переход в папку проекта
cd /home/ubuntu/aero-lunch-app

# Обновление кода
git pull origin main

# Сборка backend
cd server
npm run build

# Перезапуск сервера (если нужно)
PORT=3002 nohup node src/server.ts > backend.log 2>&1 &
```

### Принудительный webhook:
```bash
# Если автоматический деплой не сработал
curl -X POST -H "Content-Type: application/json" \
     -d '{"ref":"refs/heads/main","action":"deploy"}' \
     "https://aero-lunch.ru/api/webhook"
```

## Проверка деплоя

### Тестирование API:
```bash
# Проверка скидок
curl -X POST -H "Content-Type: application/json" \
     -d '{"items":[{"id":1,"title":"Тест","price":1000,"quantity":1}],"deliveryType":"TAKEAWAY"}' \
     "https://aero-lunch.ru/api/orders/test"
```

### Проверка фронтенда:
- Открыть https://aero-lunch.ru
- Проверить личный кабинет
- Создать тестовый заказ

## Полезные команды

### Проверка процессов на сервере:
```bash
ssh -i ~/.ssh/aero_lunch_key ubuntu@158.160.177.251 "ps aux | grep node"
```

### Просмотр логов:
```bash
ssh -i ~/.ssh/aero_lunch_key ubuntu@158.160.177.251 "cd /home/ubuntu/aero-lunch-app/server && tail -f backend.log"
```

### Статус GitHub Actions:
https://github.com/Andrey198802/aero-lunch-app/actions

## Что делать если что-то сломалось

### 1. GitHub Actions не работает:
- Проверить статус: https://github.com/Andrey198802/aero-lunch-app/actions
- Использовать ручной деплой

### 2. Webhook не работает:
- Проверить что сервер запущен
- Вызвать webhook вручную

### 3. Сервер не отвечает:
- Подключиться по SSH
- Проверить процессы: `ps aux | grep node`
- Перезапустить сервер

### 4. Изменения не попадают:
- Проверить что git push прошел успешно
- Проверить что webhook сработал
- Сделать git pull на сервере вручную

## Контакты сервера

- **IP**: 158.160.177.251
- **Пользователь**: ubuntu
- **SSH ключ**: ~/.ssh/aero_lunch_key
- **Папка проекта**: /home/ubuntu/aero-lunch-app
- **Порт backend**: 3002
- **Порт frontend**: 3000 