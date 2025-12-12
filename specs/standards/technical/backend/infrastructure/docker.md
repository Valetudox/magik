# Docker Configuration

## Dockerfile Patterns

### Simple Service Pattern (No Workspace Dependencies)

For services that don't depend on workspace packages (e.g., `backend-audio`, `backend-socket`):

```dockerfile
FROM oven/bun:1.3.3

WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy package files from the app directory
COPY apps/backend-{service-name}/package.json ./

# Install dependencies
RUN bun install --production

# Copy source code from the app directory
COPY apps/backend-{service-name}/src ./src
COPY apps/backend-{service-name}/openapi.yaml ./

# Expose port
EXPOSE {port}

# Health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:{port}/health || exit 1

# Start the application
CMD ["bun", "run", "start"]
```

### Workspace Service Pattern (With Workspace Dependencies)

For services that depend on workspace packages (e.g., `backend-decision`, `backend-specification`):

```dockerfile
FROM oven/bun:1.3.3 AS builder

WORKDIR /workspace

# Copy workspace root package files
COPY package.json bun.lock ./

# Copy workspace packages that the service depends on
COPY packages/{package-name} ./packages/{package-name}/

# Copy backend service app
COPY apps/backend-{service-name} ./apps/backend-{service-name}/

# Install all dependencies (including workspace packages)
RUN cd apps/backend-{service-name} && bun install

# Production stage
FROM oven/bun:1.3.3

WORKDIR /workspace

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy workspace root package.json for workspace configuration
COPY package.json ./

# Copy workspace packages
COPY --from=builder /workspace/packages ./packages

# Copy backend service app source
COPY apps/backend-{service-name}/package.json ./apps/backend-{service-name}/package.json
COPY apps/backend-{service-name}/src ./apps/backend-{service-name}/src
COPY apps/backend-{service-name}/openapi.yaml ./apps/backend-{service-name}/openapi.yaml

# Install dependencies in production stage
WORKDIR /workspace/apps/backend-{service-name}
RUN bun install --production

# Expose port
EXPOSE {port}

# Health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD curl -f http://localhost:{port}/health || exit 1

# Start the application
CMD ["bun", "run", "start"]
```

## Dockerfile Requirements

- MUST use `oven/bun:1.3.3` as the base image
- MUST install `curl` for health checks
- MUST include a `HEALTHCHECK` directive
- MUST expose the service port
- MUST set `CMD` to `["bun", "run", "start"]`
- Services with workspace dependencies MUST use multi-stage builds
