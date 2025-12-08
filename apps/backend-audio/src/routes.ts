import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { getRecordingHandler } from './actions/recordings/[id]/get.action'
import { listRecordingsHandler } from './actions/recordings/get.action'

export function registerRoutes(fastify: FastifyInstance) {
  // Health check endpoint
  function healthHandler(_request: FastifyRequest, _reply: FastifyReply) {
    return { status: 'ok' }
  }
  fastify.get('/health', healthHandler)

  // Recording endpoints
  fastify.get('/api/recordings', listRecordingsHandler)
  fastify.get('/api/recordings/:id', getRecordingHandler)
}
