FROM oven/bun:1.3.3 AS builder

WORKDIR /workspace

COPY package.json bun.lock ./
COPY packages ./packages/
COPY config ./config/
COPY apps/backend-tabledocument ./apps/backend-tabledocument/

RUN bun install --filter=@magik/backend-tabledocument

FROM oven/bun:1.3.3

WORKDIR /workspace

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY package.json ./
COPY --from=builder /workspace/packages ./packages
COPY --from=builder /workspace/config ./config
COPY apps/backend-tabledocument/package.json ./apps/backend-tabledocument/package.json
COPY apps/backend-tabledocument/src ./apps/backend-tabledocument/src
COPY specs/domains/tabledocument/openapi.yaml ./apps/backend-tabledocument/openapi.yaml

RUN bun install --filter=@magik/backend-tabledocument --production

RUN mkdir -p /data/table-documents

WORKDIR /workspace/apps/backend-tabledocument

EXPOSE 4004

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD curl -f http://localhost:4004/health || exit 1

CMD ["bun", "run", "start"]
