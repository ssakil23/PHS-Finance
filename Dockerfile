# -------------------------------------------------------------
# Stage 1: Build Application
# -------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first for optimal Docker layer caching
COPY package.json package-lock.json* bun.lock* ./
RUN npm install --frozen-lockfile || npm install

# Copy source files
COPY . .

# Build production bundle
RUN npm run build

# -------------------------------------------------------------
# Stage 2: Production Nginx Server
# -------------------------------------------------------------
FROM nginx:alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
