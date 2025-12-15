FROM oven/bun:1.3.3 AS builder

WORKDIR /workspace

# Copy workspace root package files
COPY package.json bun.lock ./

# Copy workspace packages that backend-decision depends on
COPY packages/agents ./packages/agents/
COPY packages/decisions ./packages/decisions/

# Copy backend-decision app
COPY apps/backend-decision ./apps/backend-decision/

# Install all dependencies (including workspace packages)
RUN cd apps/backend-decision && bun install

# Production stage
FROM oven/bun:1.3.3

WORKDIR /workspace

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy workspace root package.json for workspace configuration
COPY package.json ./

# Copy workspace packages
COPY --from=builder /workspace/packages ./packages

# Copy backend-decision app source
COPY apps/backend-decision/package.json ./apps/backend-decision/package.json
COPY apps/backend-decision/src ./apps/backend-decision/src
COPY specs/domains/decision/openapi.yaml ./apps/backend-decision/openapi.yaml

# Install dependencies in production stage
WORKDIR /workspace/apps/backend-decision
RUN bun install --production

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD curl -f http://localhost:4000/health || exit 1

# Start the application
CMD ["bun", "run", "start"]
