import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { validateTelegramWebAppData } from './utils/telegram';
import './types';

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
    const { 
      items, 
      deliveryType = 'TAKEAWAY',
      deliveryAddress, 
      flightNumber,
      customerName,
      phone, 
      email,
      notes,
      deliveryTime,
      bonusesUsed = 0,
      promoCode
    } = req.body;
    const telegramUser = req.telegramUser;

    if (!telegramUser) {
      return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    // Получаем пользователя
    const user = await prisma.user.findUnique({
      where: { telegramId: telegramUser.id.toString() },
    });

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    // Рассчитываем базовую сумму заказа
    const baseAmount = calculateTotalAmount(items);
    let totalAmount = baseAmount;
    let discountAmount = 0;

    // Применяем скидку за доставку "На борт" (-10%)
    if (deliveryType === 'ONBOARD') {
      discountAmount = baseAmount * 0.1;
    }

    // Применяем промокод если есть
    if (promoCode) {
      const promo = await prisma.promoCode.findUnique({
        where: { code: promoCode, isActive: true },
      });

      if (promo && promo.validUntil && promo.validUntil > new Date()) {
        if (promo.discountType === 'PERCENTAGE') {
          discountAmount += baseAmount * (Number(promo.discountValue) / 100);
        } else {
          discountAmount += Number(promo.discountValue);
        }
      }
    }

    // Итоговая сумма после скидок
    totalAmount = baseAmount - discountAmount;

    // Применяем бонусы (максимум 50% от суммы)
    const maxBonusUsage = totalAmount * 0.5;
    const actualBonusesUsed = Math.min(bonusesUsed, maxBonusUsage, Number(user.totalBonuses));
    totalAmount -= actualBonusesUsed;

    // Рассчитываем начисляемые бонусы (10% от итоговой суммы)
    const bonusesEarned = totalAmount * 0.1;

    // Создаем заказ в транзакции
    const result = await prisma.$transaction(async (tx) => {
    // Создаем заказ
      const order = await tx.order.create({
      data: {
        userId: telegramUser.id.toString(),
        items: JSON.stringify(items),
          totalAmount: totalAmount,
          discountAmount: discountAmount,
          bonusesUsed: actualBonusesUsed,
          bonusesEarned: bonusesEarned,
          promoCode: promoCode || null,
          deliveryType: deliveryType,
        deliveryAddress,
          flightNumber,
          customerName,
        phone,
          email,
        notes,
          deliveryTime: deliveryTime ? new Date(deliveryTime) : null,
          status: 'PENDING',
        },
      });

      // Обновляем баланс бонусов пользователя
      const newBonusBalance = Number(user.totalBonuses) - actualBonusesUsed + bonusesEarned;
      await tx.user.update({
        where: { telegramId: telegramUser.id.toString() },
        data: {
          totalBonuses: newBonusBalance,
          totalOrders: user.totalOrders + 1,
          totalSpent: Number(user.totalSpent) + totalAmount,
        },
      });

      // Записываем историю бонусов
      if (actualBonusesUsed > 0) {
        await tx.bonusHistory.create({
          data: {
            userId: telegramUser.id.toString(),
            amount: -actualBonusesUsed,
            type: 'SPENT',
            description: `Списано за заказ #${order.orderNumber}`,
            orderId: order.id,
            balanceBefore: Number(user.totalBonuses),
            balanceAfter: Number(user.totalBonuses) - actualBonusesUsed,
          },
        });
      }

      if (bonusesEarned > 0) {
        await tx.bonusHistory.create({
          data: {
            userId: telegramUser.id.toString(),
            amount: bonusesEarned,
            type: 'EARNED',
            description: `Начислено за заказ #${order.orderNumber}`,
            orderId: order.id,
            balanceBefore: Number(user.totalBonuses) - actualBonusesUsed,
            balanceAfter: newBonusBalance,
      },
        });
      }

      return order;
    });

    res.json({ 
      success: true, 
      orderId: result.id,
      orderNumber: result.orderNumber,
      totalAmount: totalAmount,
      discountAmount: discountAmount,
      bonusesUsed: actualBonusesUsed,
      bonusesEarned: bonusesEarned,
      message: 'Заказ успешно создан'
    });
    return;
  } catch (error) {
    console.error('Ошибка создания заказа:', error);
    res.status(500).json({ error: 'Ошибка создания заказа' });
    return;
  }
});

// Получение заказов пользователя
app.get('/api/orders', authenticateTelegramUser, async (req, res) => {
  try {
    const telegramUser = req.telegramUser;
    
    if (!telegramUser) {
      return res.status(401).json({ error: 'Пользователь не авторизован' });
    }
    
    const orders = await prisma.order.findMany({
      where: { userId: telegramUser.id.toString() },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json(orders);
    return;
  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    res.status(500).json({ error: 'Ошибка получения заказов' });
    return;
  }
});

// Получение информации о пользователе
app.get('/api/user/profile', authenticateTelegramUser, async (req, res) => {
  try {
    const telegramUser = req.telegramUser;
    
    if (!telegramUser) {
      return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    const user = await prisma.user.findUnique({
      where: { telegramId: telegramUser.id.toString() },
    });

    res.json({
      id: user?.id,
      firstName: user?.firstName,
      lastName: user?.lastName,
      username: user?.username,
      photoUrl: user?.photoUrl,
      phone: user?.phone,
      email: user?.email,
      birthDate: user?.birthDate,
      totalBonuses: user?.totalBonuses || 0,
      totalOrders: user?.totalOrders || 0,
      totalSpent: user?.totalSpent || 0,
      registrationDate: user?.registrationDate,
    });
    return;
  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({ error: 'Ошибка получения профиля' });
    return;
  }
});

// Обновление профиля пользователя
app.put('/api/user/profile', authenticateTelegramUser, async (req, res) => {
  try {
    const telegramUser = req.telegramUser;
    
    if (!telegramUser) {
      return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    const { phone, email, birthDate } = req.body;

    const updatedUser = await prisma.user.update({
      where: { telegramId: telegramUser.id.toString() },
      data: {
        phone,
        email,
        birthDate: birthDate ? new Date(birthDate) : null,
      },
    });

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        username: updatedUser.username,
        photoUrl: updatedUser.photoUrl,
        phone: updatedUser.phone,
        email: updatedUser.email,
        birthDate: updatedUser.birthDate,
        totalBonuses: updatedUser.totalBonuses,
        totalOrders: updatedUser.totalOrders,
        totalSpent: updatedUser.totalSpent,
        registrationDate: updatedUser.registrationDate,
      }
    });
    return;
  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({ error: 'Ошибка обновления профиля' });
    return;
  }
});

// Получение истории бонусов
app.get('/api/user/bonus-history', authenticateTelegramUser, async (req, res) => {
  try {
    const telegramUser = req.telegramUser;
    
    if (!telegramUser) {
      return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const bonusHistory = await prisma.bonusHistory.findMany({
      where: { userId: telegramUser.id.toString() },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const total = await prisma.bonusHistory.count({
      where: { userId: telegramUser.id.toString() },
    });

    res.json({
      bonusHistory,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
    return;
  } catch (error) {
    console.error('Ошибка получения истории бонусов:', error);
    res.status(500).json({ error: 'Ошибка получения истории бонусов' });
    return;
  }
});

// Получение истории заказов пользователя
app.get('/api/user/orders', authenticateTelegramUser, async (req, res) => {
  try {
    const telegramUser = req.telegramUser;
    
    if (!telegramUser) {
      return res.status(401).json({ error: 'Пользователь не авторизован' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const orders = await prisma.order.findMany({
      where: { userId: telegramUser.id.toString() },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const total = await prisma.order.count({
      where: { userId: telegramUser.id.toString() },
    });

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
    return;
  } catch (error) {
    console.error('Ошибка получения истории заказов:', error);
    res.status(500).json({ error: 'Ошибка получения истории заказов' });
    return;
  }
});

// Тестовый endpoint для создания заказа (без авторизации)
app.post('/api/orders/test', async (req, res) => {
  try {
    const { 
      items, 
      deliveryType = 'TAKEAWAY',
      deliveryAddress, 
      phone, 
      notes
    } = req.body;

    // Используем тестового пользователя
    const testUserId = '123456789';

    // Рассчитываем базовую сумму заказа
    const baseAmount = calculateTotalAmount(items);
    let totalAmount = baseAmount;
    let discountAmount = 0;

    // Применяем скидку за доставку "На борт" (-10%)
    if (deliveryType === 'ONBOARD') {
      discountAmount = baseAmount * 0.1;
    }

    // Итоговая сумма
    totalAmount = baseAmount - discountAmount;

    // Рассчитываем начисляемые бонусы (10% от итоговой суммы)
    const bonusesEarned = totalAmount * 0.1;

    // Создаем заказ
    const order = await prisma.order.create({
      data: {
        userId: testUserId,
        items: JSON.stringify(items),
        totalAmount: totalAmount,
        deliveryAddress,
        phone,
        notes,
        status: 'PENDING',
      },
    });

    res.json({ 
      success: true, 
      orderId: order.id,
      orderNumber: order.orderNumber,
      totalAmount: totalAmount,
      discountAmount: discountAmount,
      bonusesEarned: bonusesEarned,
      message: 'Тестовый заказ успешно создан'
    });
    return;
  } catch (error) {
    console.error('Ошибка создания тестового заказа:', error);
    res.status(500).json({ error: 'Ошибка создания тестового заказа' });
    return;
  }
});

// Telegram webhook для обработки сообщений
app.post('/api/telegram/webhook', async (req, res) => {
  try {
    const update = req.body;
    console.log('Получено обновление от Telegram:', JSON.stringify(update, null, 2));

    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const text = message.text;

      // Обработка команд
      if (text === '/start') {
        await sendTelegramMessage(chatId, 
          `Добро пожаловать в Aero Lunch! 🍽\n\n` +
          `Здесь вы можете заказать вкусную еду.\n\n` +
          `Доступные команды:\n` +
          `/menu - Посмотреть меню\n` +
          `/orders - Мои заказы\n` +
          `/help - Помощь`
        );
      } else if (text === '/menu') {
        await sendTelegramMessage(chatId, 
          `📋 Наше меню:\n\n` +
          `🍳 Завтраки:\n` +
          `• Овсяная каша - 250₽\n` +
          `• Омлет с сыром - 350₽\n\n` +
          `🍲 Обеды:\n` +
          `• Борщ - 420₽\n\n` +
          `☕ Напитки:\n` +
          `• Кофе - от 180₽\n\n` +
          `Для заказа свяжитесь с нами!`
        );
      } else if (text === '/orders') {
        await sendTelegramMessage(chatId, 
          `📦 Ваши заказы:\n\n` +
          `Пока что у вас нет заказов.\n` +
          `Оформите первый заказ через /menu`
        );
      } else if (text === '/help') {
        await sendTelegramMessage(chatId, 
          `❓ Помощь:\n\n` +
          `Этот бот поможет вам заказать еду.\n\n` +
          `Команды:\n` +
          `/start - Начать работу\n` +
          `/menu - Посмотреть меню\n` +
          `/orders - Мои заказы\n` +
          `/help - Эта справка\n\n` +
          `По вопросам обращайтесь к администратору.`
        );
      } else {
        await sendTelegramMessage(chatId, 
          `Извините, я не понимаю эту команду.\n` +
          `Используйте /help для списка доступных команд.`
        );
      }
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Ошибка обработки Telegram webhook:', error);
    res.status(500).json({ error: 'Ошибка обработки webhook' });
  }
});

// Функция для отправки сообщений в Telegram
async function sendTelegramMessage(chatId: number, text: string) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('Токен бота не найден');
      return;
    }

    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      console.error('Ошибка отправки сообщения:', await response.text());
    }
  } catch (error) {
    console.error('Ошибка отправки сообщения в Telegram:', error);
  }
}

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