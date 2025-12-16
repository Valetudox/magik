import type { FastifyRequest, FastifyReply } from 'fastify'

export function listTableDocuments(
  _request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    return { success: true }
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
  }
}
