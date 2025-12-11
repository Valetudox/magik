---
to: apps/backend-<%= serviceName %>/src/routes.ts
---
import type { FastifyInstance } from 'fastify'

export function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/health', () => {
    return { status: 'ok' }
  })
}
