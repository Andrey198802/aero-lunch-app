# 🚀 Деплой Aero Lunch на российские облачные сервисы

## 📋 Оглавление

1. [Яндекс.Облако](#яндексоблако)
2. [VK Cloud Solutions](#vk-cloud-solutions)
3. [Selectel](#selectel)
4. [Подготовка к деплою](#подготовка-к-деплою)
5. [Настройка Telegram Bot](#настройка-telegram-bot)

---

## 🟡 Яндекс.Облако

### Создание виртуальной машины

1. Зайдите на [cloud.yandex.ru](https://cloud.yandex.ru/)
2. Создайте новую ВМ:
   - **ОС:** Ubuntu 22.04 LTS
   - **Конфигурация:** 2 vCPU, 4 GB RAM, 20 GB SSD
   - **Сеть:** создайте внешний IP

### Настройка домена

1. В разделе "DNS" создайте зону для вашего домена
2. Добавьте A-запись, указывающую на IP виртуальной машины
3. Настройте SSL через Let's Encrypt

### Пошаговая установка

```bash
# Подключение к серверу
ssh ubuntu@your-server-ip

# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Клонирование проекта
git clone https://github.com/your-username/aero-lunch.git
cd aero-lunch

# Настройка окружения
cp server/env.example server/.env
nano server/.env
```

---

## 🔵 VK Cloud Solutions

### Создание проекта

1. Зайдите на [mcs.mail.ru](https://mcs.mail.ru/)
2. Создайте новый проект "Aero Lunch"
3. Перейдите в раздел "Серверы"

### Настройка сервера

1. Создайте ВМ:
   - **Образ:** Ubuntu 22.04
   - **Конфигурация:** Standard-2-4 (2 vCPU, 4 GB RAM)
   - **Диск:** 20 GB SSD

2. Настройте группу безопасности:
   - Откройте порты: 22, 80, 443, 5000

### База данных

1. Создайте PostgreSQL кластер:
   - **Версия:** 15
   - **Конфигурация:** db1-c2r2
   - **Диск:** 10 GB

2. Получите строку подключения для `.env`

---

## 🟢 Selectel

### Создание сервера

1. Зайдите на [my.selectel.ru](https://my.selectel.ru/)
2. Создайте Cloud Server:
   - **Регион:** Москва
   - **Образ:** Ubuntu 22.04
   - **Конфигурация:** 2 vCPU, 4 GB RAM

### Настройка

```bash
# Подключение
ssh root@your-server-ip

# Создание пользователя
adduser ubuntu
usermod -aG sudo ubuntu

# Далее как в инструкции для Яндекс.Облако
```

---

## 🛠️ Подготовка к деплою

### 1. Настройка переменных окружения

```bash
# server/.env
PORT=5000
DATABASE_URL="postgresql://username:password@localhost:5432/aero_lunch?schema=public"
TELEGRAM_BOT_TOKEN=your_bot_token_here
JWT_SECRET=your_jwt_secret_here
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
```

### 2. Сборка и запуск

```bash
# Сборка фронтенда
npm run build

# Запуск всего стека
docker-compose up -d

# Миграция базы данных
docker-compose exec backend npx prisma migrate deploy
```

### 3. Получение SSL сертификата

```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d your-domain.com

# Автообновление
sudo crontab -e
# Добавьте строку:
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🤖 Настройка Telegram Bot

### 1. Создание бота

1. Найдите @BotFather в Telegram
2. Отправьте `/newbot`
3. Введите имя: `Aero Lunch Bot`
4. Введите username: `aero_lunch_bot`
5. Скопируйте токен в `.env`

### 2. Настройка Web App

```bash
# Установка команд бота
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setMyCommands" \
-H "Content-Type: application/json" \
-d '{
  "commands": [
    {"command": "start", "description": "Запустить приложение"},
    {"command": "menu", "description": "Открыть меню"},
    {"command": "orders", "description": "Мои заказы"}
  ]
}'

# Установка Web App
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setChatMenuButton" \
-H "Content-Type: application/json" \
-d '{
  "menu_button": {
    "type": "web_app",
    "text": "Заказать еду",
    "web_app": {
      "url": "https://your-domain.com"
    }
  }
}'
```

### 3. Настройка Webhook (опционально)

```bash
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
-H "Content-Type: application/json" \
-d '{
  "url": "https://your-domain.com/api/webhook",
  "allowed_updates": ["message", "callback_query"]
}'
```

---

## 🔧 Полезные команды

### Мониторинг

```bash
# Логи всех сервисов
docker-compose logs -f

# Логи конкретного сервиса
docker-compose logs -f backend

# Состояние сервисов
docker-compose ps
```

### Обновление

```bash
# Обновление кода
git pull origin main

# Пересборка и перезапуск
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Бэкап базы данных

```bash
# Создание бэкапа
docker-compose exec postgres pg_dump -U postgres aero_lunch > backup.sql

# Восстановление
docker-compose exec -T postgres psql -U postgres aero_lunch < backup.sql
```

---

## 💰 Примерная стоимость

### Яндекс.Облако (в месяц)
- ВМ 2 vCPU, 4 GB RAM: ~1500₽
- Диск 20 GB SSD: ~200₽
- Внешний IP: ~150₽
- **Итого:** ~1850₽

### VK Cloud Solutions (в месяц)
- ВМ Standard-2-4: ~1200₽
- PostgreSQL db1-c2r2: ~800₽
- **Итого:** ~2000₽

### Selectel (в месяц)
- Cloud Server 2 vCPU, 4 GB: ~1400₽
- Диск 20 GB: ~100₽
- **Итого:** ~1500₽

---

## 🎯 Следующие шаги

1. Настроить мониторинг (Grafana + Prometheus)
2. Добавить автоматические бэкапы
3. Настроить CI/CD для автоматического деплоя
4. Добавить Redis для кеширования
5. Настроить логирование (ELK Stack)

---

## 🆘 Поддержка

При возникновении проблем:

1. Проверьте логи: `docker-compose logs`
2. Проверьте статус сервисов: `docker-compose ps`
3. Проверьте конфигурацию: `docker-compose config`
4. Обратитесь к документации провайдера

**Удачного деплоя! 🚀** 