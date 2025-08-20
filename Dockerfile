FROM node:18-alpine AS builder

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем все зависимости включая devDependencies для сборки
RUN npm i && npm cache clean --force

# Копируем исходный код
COPY . .

# Компилируем TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Устанавливаем PostgreSQL клиент для database операций
RUN apk add --no-cache postgresql-client

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем только production зависимости
RUN npm i && npm cache clean --force

# Копируем скомпилированный код из builder stage
COPY --from=builder /app/dist ./dist

# Копируем необходимые файлы для runtime
COPY scripts ./scripts
COPY migrations ./migrations
COPY knexfile.js ./

# Создаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Меняем владельца файлов
RUN chown -R nodejs:nodejs /app
USER nodejs

# Открываем порт
EXPOSE 3000

CMD ["npm", "run", "start:with-init"]
