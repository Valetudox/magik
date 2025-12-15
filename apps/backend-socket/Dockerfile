FROM oven/bun:1.3.3 AS builder

WORKDIR /workspace

COPY package.json bun.lock ./
COPY packages ./packages/
COPY config ./config/
COPY apps/backend-socket ./apps/backend-socket/

RUN bun install --filter=@magik/backend-socket

FROM oven/bun:1.3.3

WORKDIR /workspace

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY package.json ./
COPY --from=builder /workspace/packages ./packages
COPY --from=builder /workspace/config ./config
COPY apps/backend-socket/package.json ./apps/backend-socket/package.json
COPY apps/backend-socket/src ./apps/backend-socket/src
COPY specs/domains/socket/openapi.yaml ./apps/backend-socket/openapi.yaml

RUN bun install --filter=@magik/backend-socket --production

WORKDIR /workspace/apps/backend-socket

EXPOSE 3001

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["bun", "run", "start"]
