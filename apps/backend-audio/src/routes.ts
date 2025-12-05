import type { FastifyInstance } from 'fastify'
import { listRecordingsHandler, getRecordingHandler } from './actions/recordings'

export function registerRoutes(fastify: FastifyInstance) {
  // Health check endpoint
  async function healthHandler(_request, _reply) {
    return { status: 'ok' }
  }
  fastify.get('/health', healthHandler)

  // Recording endpoints
  fastify.get('/api/recordings', listRecordingsHandler)
  fastify.get('/api/recordings/:id', getRecordingHandler)
}
