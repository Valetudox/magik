import type { FastifyInstance } from 'fastify'
import { listSpecifications, getSpecification } from './actions/specifications'

export function registerRoutes(fastify: FastifyInstance) {
  // Health check
  fastify.get('/health', async () => ({
    status: 'ok',
  }))

  // Specification endpoints
  fastify.get('/api/specifications', listSpecifications)
  fastify.get('/api/specifications/:id', getSpecification)
}
