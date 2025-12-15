FROM oven/bun:1.3.3 AS builder

WORKDIR /workspace

# Copy workspace root package files
COPY package.json bun.lock ./

# Copy config workspace
COPY config ./config/

# Copy backend-audio app
COPY apps/backend-audio ./apps/backend-audio/

# Install all dependencies
RUN bun install --filter=backend-audio

# Production stage
FROM oven/bun:1.3.3

WORKDIR /workspace

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy workspace root package.json for workspace configuration
COPY package.json ./

# Copy config workspace
COPY --from=builder /workspace/config ./config

# Copy backend-audio app source
COPY apps/backend-audio/package.json ./apps/backend-audio/package.json
COPY apps/backend-audio/src ./apps/backend-audio/src
COPY specs/domains/audio/openapi.yaml ./apps/backend-audio/openapi.yaml

# Install dependencies in production stage from workspace root
RUN bun install --filter=backend-audio --production

# Create recordings directory
RUN mkdir -p /data/recordings

# Set working directory for runtime
WORKDIR /workspace/apps/backend-audio

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

# Start the application
CMD ["bun", "run", "start"]
