---
to: apps/ui-<%= serviceName %>/Dockerfile
---
# Build stage
FROM oven/bun:1.3.3 AS builder

WORKDIR /workspace

# Copy workspace package.json
COPY package.json ./

# Copy workspace packages
COPY packages ./packages
COPY config ./config
<% if (needsSpecs) { -%>
COPY specs ./specs
<% } -%>

# Copy ui-<%= serviceName %> app
COPY apps/ui-<%= serviceName %> ./apps/ui-<%= serviceName %>/
<% if (needsSpecs) { -%>

# Copy OpenAPI spec for client generation
RUN mkdir -p apps/backend-<%= serviceName %> && \
    cp <%= openapiSpec %> apps/backend-<%= serviceName %>/openapi.yaml
<% } -%>

# Install all workspace dependencies, then build
RUN bun install && \
    cd apps/ui-<%= serviceName %> && \
    VITE_BASE_PATH=<%= basePath %> bunx vite build

# Production stage with Nginx
FROM nginx:alpine

# Copy built static files
COPY --from=builder /workspace/apps/ui-<%= serviceName %>/dist /usr/share/nginx/html

# Copy nginx configuration
COPY apps/ui-<%= serviceName %>/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
