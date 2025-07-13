# 🚀 Правила правильного деплоя Aero Lunch Bot

## ⚠️ КРИТИЧЕСКИ ВАЖНО: Порядок действий

### 1. 📝 Сначала Git, потом Deploy
```bash
# ВСЕГДА сначала коммитим изменения
git add .
git commit -m "Описание изменений"
git push origin main

# ТОЛЬКО ПОТОМ деплоим
./deploy.sh
```

### 2. 🔄 Если изменения в backend
```bash
# После deploy.sh также перезапускаем backend
ssh -i ~/.ssh/aero_lunch_key ubuntu@158.160.177.251 "cd /home/ubuntu/aero-lunch-app/server && npm run build && pkill -f 'node dist/server.js' && nohup node dist/server.js > backend.log 2>&1 &"
```

## 🚨 Частые ошибки и их решения

### ❌ Проблема: Изменения не попадают на сервер
**Причина:** Забыли сделать `git push`
**Решение:** Всегда проверяйте `git status` перед деплоем

### ❌ Проблема: Кнопки/стили не работают
**Причина:** Tailwind CSS может конфликтовать
**Решение:** Используйте inline стили для критически важных элементов

### ❌ Проблема: Backend API не работает
**Причина:** Не перезапустили backend после изменений
**Решение:** Всегда перезапускайте backend после изменений в server/

## ✅ Правильный workflow

1. **Разработка локально**
   ```bash
   npm run dev  # фронтенд
   cd server && npm run dev  # backend
   ```

2. **Тестирование**
   - Проверить в браузере
   - Проверить в Telegram боте (если нужно)

3. **Коммит и пуш**
   ```bash
   git add .
   git commit -m "Описание изменений"
   git push origin main
   ```

4. **Деплой**
   ```bash
   ./deploy.sh
   ```

5. **Перезапуск backend (если были изменения)**
   ```bash
   ssh -i ~/.ssh/aero_lunch_key ubuntu@158.160.177.251 "cd /home/ubuntu/aero-lunch-app/server && npm run build && pkill -f 'node dist/server.js' && nohup node dist/server.js > backend.log 2>&1 &"
   ```

## 🔧 Полезные команды

### Проверка статуса деплоя
```bash
# Проверить что файлы обновились
ssh -i ~/.ssh/aero_lunch_key ubuntu@158.160.177.251 "ls -la /home/ubuntu/aero-lunch-app/dist/assets/"

# Проверить логи backend
ssh -i ~/.ssh/aero_lunch_key ubuntu@158.160.177.251 "cd /home/ubuntu/aero-lunch-app/server && tail -20 backend.log"
```

### Экстренный перезапуск
```bash
# Если что-то сломалось
ssh -i ~/.ssh/aero_lunch_key ubuntu@158.160.177.251 "sudo systemctl restart aero-lunch && cd /home/ubuntu/aero-lunch-app/server && pkill -f 'node dist/server.js' && nohup node dist/server.js > backend.log 2>&1 &"
```

## 📋 Чеклист перед деплоем

- [ ] Протестировано локально
- [ ] `git status` показывает чистое состояние
- [ ] Сделан `git push origin main`
- [ ] Запущен `./deploy.sh`
- [ ] Если изменения в backend - перезапущен server
- [ ] Проверено в браузере: https://aero-lunch.ru
- [ ] Проверено в боте: https://t.me/aero_lunch_bot

## 🎯 Помните главное

**Git → Deploy → Backend restart (если нужно)**

Никогда не пропускайте этап коммита в Git! 