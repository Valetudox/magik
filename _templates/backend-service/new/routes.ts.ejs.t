---
to: apps/backend-<%= serviceName %>/src/routes.ts
---
import type { FastifyInstance } from 'fastify'

export function registerRoutes(fastify: FastifyInstance) {
  // Health check endpoint
  fastify.get('/health', () => {
    return { status: 'ok' }
  })

  // Add your API routes here
  // Example:
  // fastify.get('/api/<%= serviceName %>', list<%= h.changeCase.pascalCase(serviceName) %>)
  // fastify.post('/api/<%= serviceName %>', create<%= h.changeCase.pascalCase(serviceName) %>)
}
