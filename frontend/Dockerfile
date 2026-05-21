# ============================================
# XPanel Frontend - Dockerfile
# ============================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar todos os arquivos de configuração
COPY package*.json ./
COPY tsconfig*.json ./
COPY *.config.* ./
COPY index.html ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY src ./src
COPY public ./public

# Build da aplicação
RUN npm run build

# ============================================
# Stage 2: Production com Nginx
FROM nginx:alpine

# Copiar configuração do Nginx
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /health { \
        access_log off; \
        return 200 "healthy\n"; \
        add_header Content-Type text/plain; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Copiar build do stage anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Expor porta
EXPOSE 80

# Comando de inicialização
CMD ["nginx", "-g", "daemon off;"]
