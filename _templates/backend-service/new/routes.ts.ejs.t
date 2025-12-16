---
to: apps/backend-<%= serviceName %>/src/routes.ts
---
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'

export function registerRoutes(fastify: FastifyInstance) {
  const typedFastify = fastify.withTypeProvider<ZodTypeProvider>()

  typedFastify.get('/health', () => {
    return { status: 'ok' }
  })
}
