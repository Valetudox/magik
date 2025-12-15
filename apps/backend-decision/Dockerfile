FROM oven/bun:1.3.3 AS builder

WORKDIR /workspace

COPY package.json bun.lock ./
COPY packages ./packages/
COPY config ./config/
COPY apps/backend-decision ./apps/backend-decision/

RUN bun install --filter=@magik/backend-decision

FROM oven/bun:1.3.3

WORKDIR /workspace

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY package.json ./
COPY --from=builder /workspace/packages ./packages
COPY --from=builder /workspace/config ./config
COPY apps/backend-decision/package.json ./apps/backend-decision/package.json
COPY apps/backend-decision/src ./apps/backend-decision/src
COPY specs/domains/decision/openapi.yaml ./apps/backend-decision/openapi.yaml

RUN bun install --filter=@magik/backend-decision --production

WORKDIR /workspace/apps/backend-decision

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["bun", "run", "start"]
