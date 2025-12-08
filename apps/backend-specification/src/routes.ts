import type { FastifyInstance } from 'fastify'
import { getSpecification } from './actions/specifications/[id]/get.action'
import { listSpecifications } from './actions/specifications/get.action'

export function registerRoutes(fastify: FastifyInstance) {
  // Health check
  fastify.get('/health', () => ({
    status: 'ok',
  }))

  // Specification endpoints
  fastify.get('/api/specifications', listSpecifications)
  fastify.get('/api/specifications/:id', getSpecification)
}
