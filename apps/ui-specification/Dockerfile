# Build stage
FROM oven/bun:1.3.3 AS builder

WORKDIR /workspace

# Copy workspace package.json
COPY package.json ./

# Copy workspace packages
COPY packages ./packages
COPY config ./config

# Copy ui-specification app
COPY apps/ui-specification ./apps/ui-specification

# Install all workspace dependencies, then build
RUN bun install && \
    cd apps/ui-specification && \
    VITE_BASE_PATH=/specifications bunx vite build

# Production stage with Nginx
FROM nginx:alpine

# Copy built static files
COPY --from=builder /workspace/apps/ui-specification/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/ui-specification/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
