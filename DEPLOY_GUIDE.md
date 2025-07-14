# 🚀 Деплой на продакшен

## Быстрый деплой
```bash
./update-production.sh
```

## Что делает скрипт:
1. Подключается к серверу ubuntu@158.160.177.251
2. Обновляет код из git
3. Пересобирает фронтенд (`npm run build`)
4. Копирует файлы в nginx (`/usr/share/nginx/html/`)
5. Перезапускает backend сервис

## Важные моменты:
- Используется SSH ключ `~/.ssh/aero_lunch_key`
- Проект на сервере: `/home/ubuntu/aero-lunch-app`
- Фронтенд копируется в `/usr/share/nginx/html/`
- Backend сервис: `aero-lunch-backend`

## Если что-то не работает:
1. Проверь SSH ключ: `ssh -i ~/.ssh/aero_lunch_key ubuntu@158.160.177.251`
2. Проверь путь к проекту на сервере: `/home/ubuntu/aero-lunch-app`
3. Убедись что backend сервис запущен: `sudo systemctl status aero-lunch-backend`

## Структура проекта на сервере:
```
/home/ubuntu/aero-lunch-app/  # Исходный код
/usr/share/nginx/html/        # Собранный фронтенд
```

**Главное**: Этот скрипт работает! Не меняй его без крайней необходимости. 