FROM oven/bun:1.3.3 AS builder

WORKDIR /workspace

# Copy workspace root package files
COPY package.json bun.lock ./

# Copy workspace packages that backend-tabledocument depends on
COPY packages/agents ./packages/agents/
COPY packages/tabledocuments ./packages/tabledocuments/
COPY config ./config/

# Copy backend-tabledocument app
COPY apps/backend-tabledocument ./apps/backend-tabledocument/

# Install all dependencies (including workspace packages)
RUN bun install --filter=backend-tabledocument

# Production stage
FROM oven/bun:1.3.3

WORKDIR /workspace

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy workspace root package.json for workspace configuration
COPY package.json ./

# Copy workspace packages
COPY --from=builder /workspace/packages ./packages
COPY --from=builder /workspace/config ./config

# Copy backend-tabledocument app source
COPY apps/backend-tabledocument/package.json ./apps/backend-tabledocument/package.json
COPY apps/backend-tabledocument/src ./apps/backend-tabledocument/src
COPY specs/domains/tabledocument/openapi.yaml ./apps/backend-tabledocument/openapi.yaml

# Install dependencies in production stage from workspace root
RUN bun install --filter=backend-tabledocument --production

# Set working directory for runtime
WORKDIR /workspace/apps/backend-tabledocument

# Create table-documents directory
RUN mkdir -p /data/table-documents

# Expose port
EXPOSE 4004

# Health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:4004/health || exit 1

# Start the application
CMD ["bun", "run", "start"]
