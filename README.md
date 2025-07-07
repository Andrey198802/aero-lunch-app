# Aero Lunch - Telegram Mini App

Приложение для заказа питания в бизнес-джетах через Telegram Mini App. Быстрая доставка премиум еды от 30 минут.

## Технологии

- **React 19** - UI библиотека
- **TypeScript** - типизация
- **Vite** - сборщик и dev server
- **Tailwind CSS** - стилизация
- **Telegram Mini App API** - интеграция с Telegram

## Установка

```bash
npm install
```

## Запуск

```bash
# Режим разработки
npm run dev

# Сборка для production
npm run build

# Превью production сборки
npm run preview
```

## Структура проекта

```
src/
├── components/     # React компоненты
├── hooks/         # Custom hooks
├── types/         # TypeScript типы
├── utils/         # Утилиты
├── App.tsx        # Главный компонент
├── main.tsx       # Точка входа
└── index.css      # Глобальные стили
```

## Особенности

- **Премиум дизайн** - темная тема с золотыми акцентами
- **Mobile-first** - оптимизация для смартфонов
- **Telegram интеграция** - использование Web App API
- **Быстрая загрузка** - оптимизация для работы в полете

## Deployment

Приложение можно развернуть на любом статическом хостинге:
- Vercel
- Netlify
- GitHub Pages
- Telegram Mini App hosting

## Разработка

При разработке используйте Telegram Bot для тестирования Mini App функций. 