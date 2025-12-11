import type { FastifyInstance } from 'fastify'
import { getSpecification } from './actions/specifications/[id]/get.action'
import { listSpecifications } from './actions/specifications/get.action'

export function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/health', () => ({
    status: 'ok',
  }))

  fastify.get('/api/specifications', listSpecifications)
  fastify.get('/api/specifications/:id', getSpecification)
}
