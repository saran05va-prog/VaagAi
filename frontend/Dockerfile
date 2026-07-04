# ========================================
# SMART AI FARMING PLATFORM - FRONTEND
# ========================================

FROM node:20-alpine AS base

# Install build dependencies for native modules (three.js, sharp, etc.)
RUN apk add --no-cache python3 make g++

# ========================================
# DEPENDENCY STAGE
# ========================================
FROM base AS deps

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install pnpm and dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# ========================================
# BUILDER STAGE
# ========================================
FROM base AS builder

WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml ./

# Copy source
COPY . .

# Copy production env vars for Vite build
COPY .env.production ./.env.production

# Build
RUN pnpm build

# ========================================
# PRODUCTION STAGE
# ========================================
FROM base AS runner

WORKDIR /app

# Install nginx + envsubst for dynamic port support
RUN apk add --no-cache nginx gettext

# Copy built files
COPY --from=builder /app/dist ./dist
COPY nginx.conf /etc/nginx/http.d/default.conf

# Create necessary directories and set permissions
RUN mkdir -p /var/lib/nginx/tmp /var/lib/nginx/logs /var/log/nginx && \
    chmod -R 755 /var/lib/nginx /var/log/nginx

# Expose port
EXPOSE 80

# Start nginx with dynamic port from $PORT env (Railway injects this)
CMD ["sh", "-c", "NGINX_PORT=${PORT:-80} && envsubst '${NGINX_PORT}' < /etc/nginx/http.d/default.conf > /tmp/default.conf && mv /tmp/default.conf /etc/nginx/http.d/default.conf && nginx -g 'daemon off;'"]