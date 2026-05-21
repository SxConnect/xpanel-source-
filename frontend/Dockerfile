# Build stage
FROM node:20-alpine AS build

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies with verbose logging
RUN echo "=== Installing dependencies ===" && \
    npm ci --legacy-peer-deps --verbose || npm install --legacy-peer-deps --verbose

# Copy all source files
COPY . .

# Debug: List files
RUN echo "=== Files in /app ===" && ls -la && \
    echo "=== Files in /app/src ===" && ls -la src/ && \
    echo "=== Checking tsconfig ===" && cat tsconfig.json

# Build with verbose output
RUN echo "=== Starting build ===" && \
    NODE_ENV=production npm run build --verbose

# Verify build output
RUN echo "=== Build complete, checking dist ===" && \
    ls -la dist/ && \
    echo "=== Dist contents ===" && \
    find dist/ -type f

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

RUN echo 'server{listen 80;root /usr/share/nginx/html;index index.html;location /{try_files $uri /index.html;}}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
