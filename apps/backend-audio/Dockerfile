FROM oven/bun:1.3.3 AS builder

WORKDIR /workspace

COPY package.json bun.lock ./
COPY packages ./packages/
COPY config ./config/
COPY apps/backend-audio ./apps/backend-audio/

RUN bun install --filter=@magik/backend-audio

FROM oven/bun:1.3.3

WORKDIR /workspace

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY package.json ./
COPY --from=builder /workspace/packages ./packages
COPY --from=builder /workspace/config ./config
COPY apps/backend-audio/package.json ./apps/backend-audio/package.json
COPY apps/backend-audio/src ./apps/backend-audio/src
COPY specs/domains/audio/openapi.yaml ./apps/backend-audio/openapi.yaml

RUN bun install --filter=@magik/backend-audio --production

RUN mkdir -p /data/recordings

WORKDIR /workspace/apps/backend-audio

EXPOSE 3002

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD curl -f http://localhost:3002/health || exit 1

CMD ["bun", "run", "start"]
