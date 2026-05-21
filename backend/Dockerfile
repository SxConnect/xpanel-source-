# ============================================
# XPanel Backend - Dockerfile
# Multi-stage build para otimização
# ============================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependências
RUN npm ci --only=production && \
    npm cache clean --force

# Copiar código fonte
COPY src ./src
COPY prisma ./prisma

# Gerar Prisma Client
RUN npx prisma generate

# Build do TypeScript
RUN npm run build

# ============================================
# Stage 2: Production
FROM node:20-alpine

# Instalar apenas dependências necessárias
RUN apk add --no-cache \
    tini \
    dumb-init

WORKDIR /app

# Copiar apenas o necessário do builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Mudar para usuário não-root
USER nodejs

# Expor porta
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Usar tini para gerenciar processos
ENTRYPOINT ["/sbin/tini", "--"]

# Comando de inicialização
CMD ["node", "dist/index.js"]
