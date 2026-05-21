# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Verify critical files exist
RUN echo "=== Verifying files ===" && \
    ls -la && \
    test -f "vite.config.ts" && echo "✓ vite.config.ts exists" || (echo "✗ vite.config.ts missing" && exit 1) && \
    test -f "tsconfig.json" && echo "✓ tsconfig.json exists" || (echo "✗ tsconfig.json missing" && exit 1) && \
    test -f "index.html" && echo "✓ index.html exists" || (echo "✗ index.html missing" && exit 1) && \
    test -d "src" && echo "✓ src/ exists" || (echo "✗ src/ missing" && exit 1) && \
    test -f "src/main.tsx" && echo "✓ src/main.tsx exists" || (echo "✗ src/main.tsx missing" && exit 1)

# Build application (skip type checking)
RUN set -x && \
    npm run build 2>&1 | tee /tmp/build.log; \
    BUILD_EXIT=$?; \
    echo "Build exit code: $BUILD_EXIT"; \
    cat /tmp/build.log; \
    if [ $BUILD_EXIT -ne 0 ]; then \
        echo "=== BUILD FAILED ==="; \
        exit 1; \
    fi; \
    if [ ! -d "dist" ]; then \
        echo "=== ERROR: dist folder not created ==="; \
        ls -la; \
        exit 1; \
    fi; \
    echo "=== Build successful, dist folder exists ==="; \
    ls -la dist/

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Configure nginx
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
