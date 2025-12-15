# Build stage
FROM oven/bun:1.3.3 AS builder

WORKDIR /workspace

# Copy workspace package.json and lockfile
COPY package.json bun.lock ./

# Copy workspace packages
COPY packages/ui-shared ./packages/ui-shared
COPY packages/decisions ./packages/decisions

# Copy ui-decision app
COPY apps/ui-decision ./apps/ui-decision

# Install dependencies from workspace root, then build
RUN bun install --filter=@magik/ui-decision --ignore-scripts && \
    cd apps/ui-decision && \
    VITE_BASE_PATH=/decisions bunx vite build

# Production stage with Nginx
FROM nginx:alpine

# Copy built static files
COPY --from=builder /workspace/apps/ui-decision/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/ui-decision/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
