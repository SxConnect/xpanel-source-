# ============================================
# XPanel Backend - Dockerfile
# ============================================

FROM node:20-alpine

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache openssl

# Copiar package files
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY src ./src
COPY prisma ./prisma

# Gerar Prisma Client
RUN npx prisma generate

# Build do TypeScript
RUN npm run build

# Expor porta
EXPOSE 4000

# Comando de inicialização
CMD ["node", "dist/index.js"]
