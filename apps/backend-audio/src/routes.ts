import type { FastifyInstance } from 'fastify'
import { listRecordingsHandler, getRecordingHandler } from './actions/recordings'

export function registerRoutes(fastify: FastifyInstance) {
  // Health check endpoint
  fastify.get('/health', async (_request, _reply) => {
    return { status: 'ok' }
  })

  // Recording endpoints
  fastify.get('/api/recordings', listRecordingsHandler)
  fastify.get('/api/recordings/:id', getRecordingHandler)
}
