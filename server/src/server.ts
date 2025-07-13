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
    'https://aero-lunch.ru',
    'https://www.aero-lunch.ru'
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

// Регистрация/обновление пользователя (без строгой авторизации)
app.post('/api/user/register', async (req, res) => {
  try {
    const initData = req.headers['x-telegram-init-data'];
    
    if (!initData) {
      return res.status(400).json({ error: 'Отсутствуют данные пользователя' });
    }

    // Парсим данные пользователя без строгой валидации
    const urlParams = new URLSearchParams(initData as string);
    const userJson = urlParams.get('user');
    
    if (userJson) {
      const user = JSON.parse(userJson);
      console.log('Регистрируем пользователя:', user);
      
      // Сохраняем пользователя в БД или обновляем
      const savedUser = await prisma.user.upsert({
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

      res.json({ 
        success: true, 
        message: 'Пользователь зарегистрирован',
        user: savedUser
      });
    } else {
      res.status(400).json({ error: 'Неверные данные пользователя' });
    }
  } catch (error) {
    console.error('Ошибка регистрации пользователя:', error);
    res.status(500).json({ error: 'Ошибка регистрации пользователя' });
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
        // Устанавливаем кнопку меню для этого пользователя
        await setMenuButtonForUser(chatId);
        
        // Сначала отправляем фото с описанием
        await sendTelegramPhoto(chatId, 
          'https://raw.githubusercontent.com/Andrey198802/aero-lunch-app/main/public/logo_aero2.svg',
          `🍽 <b>Добро пожаловать в Aero Lunch!</b> ✈️\n\n` +
          `🚀 <i>Быстрая доставка еды прямо на борт самолета!</i>\n\n` +
          `<b>🍳 У нас вы найдете:</b>\n` +
          `• Свежие завтраки\n` +
          `• Сытные обеды\n` +
          `• Полезные закуски\n` +
          `• Ароматные напитки\n\n` +
          `⏰ <b>Доставка от 30 минут</b>\n` +
          `💳 Оплата картой или бонусами\n` +
          `🎁 Накапливайте бонусы с каждым заказом!\n\n` +
          `<b>Нажмите кнопку "МЕНЮ" ниже, чтобы сделать заказ! 👇</b>`
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

// Функция для отправки фото в Telegram
async function sendTelegramPhoto(chatId: number, photoUrl: string, caption: string) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('Токен бота не найден');
      return;
    }

    const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoUrl,
        caption: caption,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      console.error('Ошибка отправки фото:', await response.text());
    }
  } catch (error) {
    console.error('Ошибка отправки фото в Telegram:', error);
  }
}

// Функция для установки кнопки меню для конкретного пользователя
async function setMenuButtonForUser(chatId: number) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('Токен бота не найден');
      return;
    }

    const url = `https://api.telegram.org/bot${botToken}/setChatMenuButton`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        menu_button: {
          type: 'web_app',
          text: 'МЕНЮ',
          web_app: {
            url: 'https://aero-lunch.ru'
          }
        }
      }),
    });

    if (response.ok) {
      console.log(`Кнопка меню установлена для пользователя ${chatId}`);
    } else {
      console.error('Ошибка установки кнопки меню для пользователя:', await response.text());
    }
  } catch (error) {
    console.error('Ошибка установки кнопки меню для пользователя:', error);
  }
}

// Функция для установки кнопки меню бота
async function setMenuButton() {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('Токен бота не найден');
      return;
    }

    const url = `https://api.telegram.org/bot${botToken}/setChatMenuButton`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        menu_button: {
          type: 'web_app',
          text: 'МЕНЮ',
          web_app: {
            url: 'https://aero-lunch.ru'
          }
        }
      }),
    });

    if (response.ok) {
      console.log('Кнопка меню успешно установлена');
      const result = await response.json();
      console.log('Результат:', result);
    } else {
      console.error('Ошибка установки кнопки меню:', await response.text());
    }
  } catch (error) {
    console.error('Ошибка установки кнопки меню:', error);
  }
}

// Функция для расчета общей суммы заказа
function calculateTotalAmount(items: any[]): number {
  return items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
}

// Middleware для проверки прав администратора
const authenticateAdmin = (req: any, res: any, next: any) => {
  const adminPassword = req.headers['x-admin-password'];
  
  // Временная проверка пароля (в продакшене использовать более безопасный способ)
  if (adminPassword === 'admin123') {
    next();
  } else {
    res.status(401).json({ error: 'Недостаточно прав доступа' });
  }
};

// Админские endpoint'ы
app.post('/api/admin/auth', (req: any, res: any) => {
  const { password } = req.body;
  
  if (password === 'admin123') {
    res.json({ 
      success: true, 
      token: 'admin-token-placeholder' // В продакшене использовать JWT
    });
  } else {
    res.status(401).json({ error: 'Неверный пароль' });
  }
});

// Получение статистики для админки
app.get('/api/admin/stats', authenticateAdmin, async (req: any, res: any) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Заказы за сегодня
    const todayOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });
    
    // Общее количество пользователей
    const totalUsers = await prisma.user.count();
    
    // Выручка за сегодня
    const todayRevenue = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow
        },
        status: {
          not: 'CANCELLED'
        }
      },
      _sum: {
        totalAmount: true
      }
    });
    
    res.json({
      todayOrders,
      totalUsers,
      todayRevenue: todayRevenue._sum.totalAmount || 0
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка получения статистики' });
  }
});

// Получение списка заказов для админки
app.get('/api/admin/orders', authenticateAdmin, async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    
    const where: any = {};
    if (status) {
      where.status = status;
    }
    
    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            telegramId: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });
    
    const total = await prisma.order.count({ where });
    
    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка получения заказов:', error);
    res.status(500).json({ error: 'Ошибка получения заказов' });
  }
});

// Обновление статуса заказа
app.put('/api/admin/orders/:id/status', authenticateAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const order = await prisma.order.update({
      where: { id: id },
      data: { status },
      include: {
        user: true
      }
    });
    
    // Отправляем уведомление пользователю
    const statusMessages = {
      'CONFIRMED': 'Ваш заказ подтвержден и готовится',
      'PREPARING': 'Ваш заказ готовится',
      'READY': 'Ваш заказ готов к выдаче',
      'DELIVERED': 'Ваш заказ доставлен',
      'CANCELLED': 'Ваш заказ отменен'
    };
    
    const message = statusMessages[status as keyof typeof statusMessages];
    if (message && order.user) {
      await sendTelegramMessage(parseInt(order.user.telegramId), message);
    }
    
    res.json({ success: true, order });
  } catch (error) {
    console.error('Ошибка обновления статуса заказа:', error);
    res.status(500).json({ error: 'Ошибка обновления статуса заказа' });
  }
});

// === УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ ===

// Получение списка всех пользователей
app.get('/api/admin/users', authenticateAdmin, async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    
    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        telegramId: true,
        firstName: true,
        lastName: true,
        username: true,
        phone: true,
        email: true,
        totalBonuses: true,
        totalOrders: true,
        totalSpent: true,
        registrationDate: true,
        lastActive: true,
        createdAt: true
      },
      orderBy: {
        lastActive: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });
    
    const total = await prisma.user.count({ where });
    
    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({ error: 'Ошибка получения пользователей' });
  }
});

// Получение детальной информации о пользователе
app.get('/api/admin/users/:id', authenticateAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: id },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        bonusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Ошибка получения пользователя:', error);
    res.status(500).json({ error: 'Ошибка получения пользователя' });
  }
});

// Получение заказов пользователя
app.get('/api/admin/users/:id/orders', authenticateAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const orders = await prisma.order.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });
    
    const total = await prisma.order.count({ where: { userId: id } });
    
    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Ошибка получения заказов пользователя:', error);
    res.status(500).json({ error: 'Ошибка получения заказов пользователя' });
  }
});

// Управление бонусами пользователя
app.post('/api/admin/users/:id/bonuses', authenticateAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { amount, type, description } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { id: id }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    const currentBalance = Number(user.totalBonuses);
    const changeAmount = Number(amount);
    
    // Проверяем, что не уходим в минус при списании
    if (type === 'USED' && currentBalance < changeAmount) {
      return res.status(400).json({ error: 'Недостаточно бонусов для списания' });
    }
    
    const newBalance = type === 'EARNED' 
      ? currentBalance + changeAmount 
      : currentBalance - changeAmount;
    
    // Обновляем баланс пользователя
    await prisma.user.update({
      where: { id: id },
      data: { totalBonuses: newBalance }
    });
    
    // Создаем запись в истории бонусов
    await prisma.bonusHistory.create({
      data: {
        userId: id,
        amount: changeAmount,
        type: type,
        description: description || `Админ ${type === 'EARNED' ? 'начислил' : 'списал'} бонусы`,
        balanceBefore: currentBalance,
        balanceAfter: newBalance
      }
    });
    
    // Отправляем уведомление пользователю
    const message = type === 'EARNED' 
      ? `Вам начислено ${changeAmount} бонусов! Баланс: ${newBalance}`
      : `Списано ${changeAmount} бонусов. Баланс: ${newBalance}`;
    
    await sendTelegramMessage(parseInt(user.telegramId), message);
    
    res.json({ 
      success: true, 
      newBalance,
      message: 'Бонусы успешно обновлены'
    });
  } catch (error) {
    console.error('Ошибка управления бонусами:', error);
    res.status(500).json({ error: 'Ошибка управления бонусами' });
  }
});

// Блокировка/разблокировка пользователя
app.put('/api/admin/users/:id/status', authenticateAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { blocked, reason } = req.body;
    
    const user = await prisma.user.findUnique({
      where: { id: id }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    // Добавляем поле blocked в базу данных (если его нет)
    // Пока что просто отправляем уведомление
    
    const message = blocked 
      ? `Ваш аккаунт заблокирован. Причина: ${reason || 'Не указана'}`
      : 'Ваш аккаунт разблокирован';
    
    await sendTelegramMessage(parseInt(user.telegramId), message);
    
    res.json({ 
      success: true, 
      message: `Пользователь ${blocked ? 'заблокирован' : 'разблокирован'}`
    });
  } catch (error) {
    console.error('Ошибка изменения статуса пользователя:', error);
    res.status(500).json({ error: 'Ошибка изменения статуса пользователя' });
  }
});

// Временный endpoint для создания тестовых пользователей
app.post('/api/admin/create-test-users', authenticateAdmin, async (req: any, res: any) => {
  try {
    console.log('Создаем тестовых пользователей...');

    const testUsers = [
      {
        telegramId: '111111111',
        firstName: 'Анна',
        lastName: 'Иванова',
        username: 'anna_ivanova',
        phone: '+7 (999) 123-45-67',
        email: 'anna@example.com',
        totalBonuses: 150.50,
        totalOrders: 5,
        totalSpent: 2340.75,
        registrationDate: new Date('2024-01-15T10:30:00Z'),
        lastActive: new Date('2024-07-12T14:20:00Z')
      },
      {
        telegramId: '222222222',
        firstName: 'Дмитрий',
        lastName: 'Петров',
        username: 'dmitry_petrov',
        phone: '+7 (999) 234-56-78',
        email: 'dmitry@example.com',
        totalBonuses: 75.25,
        totalOrders: 3,
        totalSpent: 1250.00,
        registrationDate: new Date('2024-02-20T09:15:00Z'),
        lastActive: new Date('2024-07-13T11:45:00Z')
      },
      {
        telegramId: '333333333',
        firstName: 'Елена',
        lastName: 'Сидорова',
        username: 'elena_sidorova',
        phone: '+7 (999) 345-67-89',
        email: null,
        totalBonuses: 320.00,
        totalOrders: 12,
        totalSpent: 4560.30,
        registrationDate: new Date('2023-11-10T16:22:00Z'),
        lastActive: new Date('2024-07-13T09:30:00Z')
      },
      {
        telegramId: '444444444',
        firstName: 'Михаил',
        lastName: null,
        username: 'mikhail_user',
        phone: null,
        email: 'mikhail@example.com',
        totalBonuses: 45.75,
        totalOrders: 2,
        totalSpent: 890.50,
        registrationDate: new Date('2024-03-05T12:10:00Z'),
        lastActive: new Date('2024-07-11T18:15:00Z')
      },
      {
        telegramId: '555555555',
        firstName: 'Ольга',
        lastName: 'Кузнецова',
        username: null,
        phone: '+7 (999) 456-78-90',
        email: 'olga@example.com',
        totalBonuses: 0.00,
        totalOrders: 0,
        totalSpent: 0.00,
        registrationDate: new Date('2024-07-13T08:00:00Z'),
        lastActive: new Date('2024-07-13T08:00:00Z')
      }
    ];

    const createdUsers = [];
    
    for (const userData of testUsers) {
      const user = await prisma.user.upsert({
        where: { telegramId: userData.telegramId },
        update: userData,
        create: userData
      });
      
      createdUsers.push(user);
      console.log(`✅ Создан пользователь: ${user.firstName} ${user.lastName || ''}`);
    }

    res.json({ 
      success: true, 
      message: 'Тестовые пользователи созданы',
      users: createdUsers 
    });
  } catch (error) {
    console.error('❌ Ошибка при создании пользователей:', error);
    res.status(500).json({ error: 'Ошибка при создании пользователей' });
  }
});

// Обработчик ошибок
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Что-то пошло не так!' });
});

// Запуск сервера
const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  
  // Устанавливаем кнопку меню при запуске сервера
  setMenuButton();
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