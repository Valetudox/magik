---
to: apps/backend-<%= serviceName %>/Dockerfile
---
FROM oven/bun:1.3.3 AS builder

WORKDIR /workspace

# Copy workspace root package files
COPY package.json bun.lock ./

# Copy backend-<%= serviceName %> app
COPY apps/backend-<%= serviceName %> ./apps/backend-<%= serviceName %>/

# Install all dependencies (including workspace packages)
RUN cd apps/backend-<%= serviceName %> && bun install

# Production stage
FROM oven/bun:1.3.3

WORKDIR /workspace

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy workspace root package.json for workspace configuration
COPY package.json ./

# Copy backend-<%= serviceName %> app source
COPY apps/backend-<%= serviceName %>/package.json ./apps/backend-<%= serviceName %>/package.json
COPY apps/backend-<%= serviceName %>/src ./apps/backend-<%= serviceName %>/src
COPY apps/backend-<%= serviceName %>/openapi.yaml ./apps/backend-<%= serviceName %>/openapi.yaml

# Install dependencies in production stage
WORKDIR /workspace/apps/backend-<%= serviceName %>
RUN bun install --production

# Expose port
EXPOSE <%= port %>

# Health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD curl -f http://localhost:<%= port %>/health || exit 1

# Start the application
CMD ["bun", "run", "start"]
