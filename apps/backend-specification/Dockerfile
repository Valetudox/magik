FROM oven/bun:1.3.3 AS builder

WORKDIR /workspace

# Copy workspace root package files
COPY package.json bun.lock ./

# Copy config workspace
COPY config ./config/

# Copy backend-specification app
COPY apps/backend-specification ./apps/backend-specification/

# Install all dependencies
RUN bun install --filter=@magik/backend-specification

# Production stage
FROM oven/bun:1.3.3

WORKDIR /workspace

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy workspace root package.json for workspace configuration
COPY package.json ./

# Copy config workspace
COPY --from=builder /workspace/config ./config

# Copy backend-specification app source
COPY apps/backend-specification/package.json ./apps/backend-specification/package.json
COPY apps/backend-specification/src ./apps/backend-specification/src
COPY specs/domains/specification/openapi.yaml ./apps/backend-specification/openapi.yaml

# Install dependencies in production stage from workspace root
RUN bun install --filter=@magik/backend-specification --production

# Set working directory for runtime
WORKDIR /workspace/apps/backend-specification

# Expose port
EXPOSE 4002

# Health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD curl -f http://localhost:4002/health || exit 1

# Start the application
CMD ["bun", "run", "start"]
