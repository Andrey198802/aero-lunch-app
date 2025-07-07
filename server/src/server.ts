import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { validateTelegramWebAppData } from './utils/telegram';

// Загружаем переменные окружения
dotenv.config();

// Создаем экземпляр приложения
const app = express();
const prisma = new PrismaClient();

// Middleware для безопасности
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "https://telegram.org"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.telegram.org"],
      frameSrc: ["'self'", "https://telegram.org"],
    },
  },
}));

// CORS для Telegram Web App
app.use(cors({
  origin: [
    'https://web.telegram.org',
    'https://telegram.org',
    'https://*.ngrok.io',
    'https://*.ngrok-free.app',
    'http://localhost:3000',
    'http://localhost:3001',
    // Добавьте здесь домен вашего продакшен сайта
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  message: { error: 'Слишком много запросов, попробуйте позже' },
});

app.use(limiter);

// Парсинг JSON
app.use(express.json());

// Middleware для проверки Telegram Web App данных
const authenticateTelegramUser = async (req: any, res: any, next: any) => {
  try {
    const initData = req.headers['x-telegram-init-data'];
    
    if (!initData) {
      return res.status(401).json({ error: 'Отсутствуют данные авторизации' });
    }

    const isValid = validateTelegramWebAppData(initData);
    if (!isValid) {
      return res.status(401).json({ error: 'Неверные данные авторизации' });
    }

    // Парсим данные пользователя
    const urlParams = new URLSearchParams(initData);
    const userJson = urlParams.get('user');
    
    if (userJson) {
      const user = JSON.parse(userJson);
      req.telegramUser = user;
      
      // Сохраняем пользователя в БД или обновляем
      await prisma.user.upsert({
        where: { telegramId: user.id.toString() },
        update: {
          firstName: user.first_name,
          lastName: user.last_name,
          username: user.username,
          photoUrl: user.photo_url,
          lastActive: new Date(),
        },
        create: {
          telegramId: user.id.toString(),
          firstName: user.first_name,
          lastName: user.last_name,
          username: user.username,
          photoUrl: user.photo_url,
          lastActive: new Date(),
        },
      });
    }

    next();
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    res.status(401).json({ error: 'Ошибка авторизации' });
  }
};

// Базовый маршрут
app.get('/', (req, res) => {
  res.json({ 
    message: 'Aero Lunch API работает!',
    version: '1.0.0',
    status: 'OK'
  });
});

// API маршруты
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Получение меню
app.get('/api/menu', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        items: {
          include: {
            variants: true,
          },
        },
      },
    });
    res.json(categories);
  } catch (error) {
    console.error('Ошибка получения меню:', error);
    res.status(500).json({ error: 'Ошибка получения меню' });
  }
});

// Создание заказа
app.post('/api/orders', authenticateTelegramUser, async (req, res) => {
  try {
    const { items, deliveryAddress, phone, notes } = req.body;
    const telegramUser = req.telegramUser;

    // Создаем заказ
    const order = await prisma.order.create({
      data: {
        userId: telegramUser.id.toString(),
        items: JSON.stringify(items),
        deliveryAddress,
        phone,
        notes,
        status: 'pending',
        totalAmount: calculateTotalAmount(items),
      },
    });

    res.json({ 
      success: true, 
      orderId: order.id,
      message: 'Заказ успешно создан'
    });
  } catch (error) {
    console.error('Ошибка создания заказа:', error);
    res.status(500).json({ error: 'Ошибка создания заказа' });
  }
});

// Получение заказов пользователя
app.get('/api/orders', authenticateTelegramUser, async (req, res) => {
  try {
    const telegramUser = req.telegramUser;
    
    const orders = await prisma.order.findMany({
      where: { userId: telegramUser.id.toString() },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json(orders);
  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    res.status(500).json({ error: 'Ошибка получения заказов' });
  }
});

// Функция для расчета общей суммы заказа
function calculateTotalAmount(items: any[]): number {
  return items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
}

// Обработчик ошибок
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Что-то пошло не так!' });
});

// Запуск сервера
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Получен сигнал завершения...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Получен сигнал прерывания...');
  await prisma.$disconnect();
  process.exit(0);
}); 