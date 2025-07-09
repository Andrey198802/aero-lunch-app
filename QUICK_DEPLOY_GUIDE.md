# 🚀 Быстрый деплой на сервер Яндекс.Облако

## Данные сервера
- **IP**: 158.160.177.251
- **Пользователь**: ubuntu
- **SSH ключ**: ~/.ssh/aero_lunch_key
- **Путь к проекту**: /home/ubuntu/aero-lunch-app/dist

## Пошаговая инструкция

### 1. Собрать проект локально
```bash
npm run build
```

### 2. Загрузить файлы на сервер
```bash
scp -i ~/.ssh/aero_lunch_key -r dist/* ubuntu@158.160.177.251:/home/ubuntu/aero-lunch-app/dist/
```

### 3. Перезапустить веб-сервер (если нужно)
```bash
ssh -i ~/.ssh/aero_lunch_key ubuntu@158.160.177.251 "sudo pkill -f 'python3 -m http.server' && cd /home/ubuntu/aero-lunch-app/dist && sudo python3 -m http.server 80 > /dev/null 2>&1 &"
```

## Быстрая команда (всё в одном)
Скопируйте и выполните эту команду для полного деплоя:

```bash
npm run build && \
scp -i ~/.ssh/aero_lunch_key -r dist/* ubuntu@158.160.177.251:/home/ubuntu/aero-lunch-app/dist/ && \
echo "✅ Деплой завершен! Откройте http://158.160.177.251"
```

## Альтернативный скрипт
Используйте готовый скрипт:
```bash
./scripts/deploy-simple.sh
```

## Проверка
- Откройте http://158.160.177.251
- Если видите старую версию - очистите кеш браузера (Ctrl+F5)

## Важные директории на сервере
- Основной проект: `/home/ubuntu/aero-lunch-app/`
- Статические файлы: `/home/ubuntu/aero-lunch-app/dist/`
- Временная папка: `/home/ubuntu/aero-lunch/` (не используется)

## Решение проблем

### Если сервер не отвечает
```bash
# Проверить статус
ssh -i ~/.ssh/aero_lunch_key ubuntu@158.160.177.251 "ps aux | grep python"

# Перезапустить
ssh -i ~/.ssh/aero_lunch_key ubuntu@158.160.177.251 "sudo pkill -f 'python3 -m http.server' && cd /home/ubuntu/aero-lunch-app/dist && sudo python3 -m http.server 80 > /dev/null 2>&1 &"
```

### Если нужно создать директорию
```bash
ssh -i ~/.ssh/aero_lunch_key ubuntu@158.160.177.251 "mkdir -p /home/ubuntu/aero-lunch-app/dist"
```

---
📝 Последний успешный деплой: Цветовая схема "Минималистичная роскошь" (черный + золотой) 