FROM oven/bun:1.3.3 AS builder

WORKDIR /workspace

# Copy workspace root package files
COPY package.json bun.lock ./

# Copy config workspace
COPY config ./config/

# Copy backend-socket app
COPY apps/backend-socket ./apps/backend-socket/

# Install all dependencies
RUN bun install --filter=backend-socket

# Production stage
FROM oven/bun:1.3.3

WORKDIR /workspace

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy workspace root package.json for workspace configuration
COPY package.json ./

# Copy config workspace
COPY --from=builder /workspace/config ./config

# Copy backend-socket app source
COPY apps/backend-socket/package.json ./apps/backend-socket/package.json
COPY apps/backend-socket/src ./apps/backend-socket/src
COPY specs/domains/socket/openapi.yaml ./apps/backend-socket/openapi.yaml

# Install dependencies in production stage from workspace root
RUN bun install --filter=backend-socket --production

# Set working directory for runtime
WORKDIR /workspace/apps/backend-socket

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["bun", "run", "start"]
