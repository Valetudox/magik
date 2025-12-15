FROM oven/bun:1.3.3

WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy package files from the app directory
COPY apps/backend-tabledocument/package.json ./

# Install dependencies
RUN bun install --production

# Copy source code from the app directory
COPY apps/backend-tabledocument/src ./src
COPY specs/domains/tabledocument/openapi.yaml ./

# Create table-documents directory
RUN mkdir -p /data/table-documents

# Expose port
EXPOSE 4004

# Health check
HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:4004/health || exit 1

# Start the application
CMD ["bun", "run", "start"]
