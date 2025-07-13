const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('Создаем тестовых пользователей...');

    // Тестовые пользователи
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

    // Создаем каждого пользователя
    for (const userData of testUsers) {
      const user = await prisma.user.upsert({
        where: { telegramId: userData.telegramId },
        update: userData,
        create: userData
      });

      console.log(`✅ Создан пользователь: ${user.firstName} ${user.lastName || ''} (@${user.username || 'без username'})`);
    }

    console.log('\n🎉 Все тестовые пользователи успешно созданы!');
  } catch (error) {
    console.error('❌ Ошибка при создании пользователей:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers(); 