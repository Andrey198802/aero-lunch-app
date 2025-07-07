FROM node:18-alpine AS builder

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем исходный код
COPY . .

# Генерируем Prisma Client
RUN npx prisma generate

# Собираем приложение
RUN npm run build

# Продакшн образ
FROM node:18-alpine

WORKDIR /app

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Копируем собранное приложение
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Устанавливаем пользователя
USER nodejs

# Открываем порт
EXPOSE 5000

# Команда запуска
CMD ["npm", "start"] 