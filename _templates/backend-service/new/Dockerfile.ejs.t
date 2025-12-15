---
to: apps/backend-<%= serviceName %>/Dockerfile
---
FROM oven/bun:1.3.3 AS builder

WORKDIR /workspace

COPY package.json bun.lock ./
COPY packages ./packages/
COPY config ./config/
COPY apps/backend-<%= serviceName %> ./apps/backend-<%= serviceName %>/

RUN bun install --filter=@magik/backend-<%= serviceName %>

FROM oven/bun:1.3.3

WORKDIR /workspace

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY package.json ./
COPY --from=builder /workspace/packages ./packages
COPY --from=builder /workspace/config ./config
COPY apps/backend-<%= serviceName %>/package.json ./apps/backend-<%= serviceName %>/package.json
COPY apps/backend-<%= serviceName %>/src ./apps/backend-<%= serviceName %>/src
COPY specs/domains/<%= serviceName %>/openapi.yaml ./apps/backend-<%= serviceName %>/openapi.yaml

RUN bun install --filter=@magik/backend-<%= serviceName %> --production
<% if (dataFolders && dataFolders.length > 0) { -%>
<% dataFolders.forEach(folder => { -%>

RUN mkdir -p <%= folder %>
<% }); -%>
<% } -%>

WORKDIR /workspace/apps/backend-<%= serviceName %>

EXPOSE <%= port %>

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD curl -f http://localhost:<%= port %>/health || exit 1

CMD ["bun", "run", "start"]
