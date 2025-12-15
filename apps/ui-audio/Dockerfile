# Build stage
FROM oven/bun:1.3.3 AS builder

WORKDIR /workspace

# Copy workspace package.json and lockfile
COPY package.json bun.lock ./

# Copy workspace packages
COPY packages/ui-shared ./packages/ui-shared
COPY packages/backend-audio-client ./packages/backend-audio-client

# Copy ui-audio app
COPY apps/ui-audio ./apps/ui-audio

# Install dependencies from workspace root, then build
RUN bun install --filter=@magik/ui-audio --ignore-scripts && \
    cd apps/ui-audio && \
    VITE_BASE_PATH=/audio bunx vite build

# Production stage with Nginx
FROM nginx:alpine

# Copy built static files
COPY --from=builder /workspace/apps/ui-audio/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/ui-audio/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
