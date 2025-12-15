FROM oven/bun:1.3.3 AS builder

WORKDIR /workspace

COPY package.json bun.lock ./
COPY config ./config/
COPY apps/backend-specification ./apps/backend-specification/

RUN bun install --filter=@magik/backend-specification

FROM oven/bun:1.3.3

WORKDIR /workspace

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY package.json ./
COPY --from=builder /workspace/config ./config
COPY apps/backend-specification/package.json ./apps/backend-specification/package.json
COPY apps/backend-specification/src ./apps/backend-specification/src
COPY specs/domains/specification/openapi.yaml ./apps/backend-specification/openapi.yaml

RUN bun install --filter=@magik/backend-specification --production

WORKDIR /workspace/apps/backend-specification

EXPOSE 3003

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD curl -f http://localhost:3003/health || exit 1

CMD ["bun", "run", "start"]
