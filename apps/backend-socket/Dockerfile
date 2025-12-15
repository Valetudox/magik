FROM oven/bun:1.3.3

WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy package files from the app directory
COPY apps/backend-socket/package.json ./

# Install dependencies
RUN bun install --production

# Copy source code from the app directory
COPY apps/backend-socket/src ./src
COPY specs/domains/socket/openapi.yaml ./

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=5s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["bun", "run", "start"]
