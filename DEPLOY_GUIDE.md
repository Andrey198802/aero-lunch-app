# 🚀 Деплой на продакшен

## Правильный процесс деплоя:

1. **Делаем изменения в коде**
2. **Коммитим изменения:**
   ```bash
   git add -A
   git commit -m "Описание изменений"
   ```
3. **Запускаем деплой:**
   ```bash
   ./update-production.sh
   ```

## Что делает скрипт:
1. Проверяет что все изменения закоммичены
2. Пушит изменения на GitHub (`git push origin main`)
3. Подключается к серверу ubuntu@158.160.177.251
4. Обновляет код из git (`git pull origin main`)
5. Пересобирает фронтенд (`npm run build`)
6. Копирует файлы в nginx (`/usr/share/nginx/html/`)
7. Перезапускает backend сервис

## ⚠️ Важно:
- **Всегда коммитьте изменения перед деплоем!**
- Скрипт автоматически пушит на GitHub
- Если есть незакоммиченные изменения - скрипт остановится

## Технические детали:
- SSH ключ: `~/.ssh/aero_lunch_key`
- Проект на сервере: `/home/ubuntu/aero-lunch-app`
- Фронтенд копируется в: `/usr/share/nginx/html/`
- Backend сервис: `aero-lunch-backend`

## Если что-то не работает:
1. Проверь что изменения закоммичены: `git status`
2. Проверь SSH ключ: `ssh -i ~/.ssh/aero_lunch_key ubuntu@158.160.177.251`
3. Убедись что backend сервис запущен: `sudo systemctl status aero-lunch-backend`

## Структура на сервере:
```
/home/ubuntu/aero-lunch-app/  # Исходный код
/usr/share/nginx/html/        # Собранный фронтенд для nginx
```

**Главное правило**: Commit → Deploy → Profit! 🎉 