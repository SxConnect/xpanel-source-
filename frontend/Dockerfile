# ============================================
# XPanel Frontend - Dockerfile Simplificado
# ============================================

FROM node:20-alpine AS builder

WORKDIR /app

# Aumentar memória do Node.js
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copiar tudo
COPY . .

# Instalar dependências
RUN npm install --legacy-peer-deps --loglevel verbose

# Buildar aplicação
RUN npm run build

# ============================================
# Stage 2: Nginx
FROM nginx:alpine

# Configuração do Nginx
RUN echo 'server { listen 80; root /usr/share/nginx/html; index index.html; location / { try_files $uri /index.html; } }' > /etc/nginx/conf.d/default.conf

# Copiar build
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
