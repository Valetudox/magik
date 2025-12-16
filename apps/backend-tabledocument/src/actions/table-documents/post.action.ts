import type { FastifyRequest, FastifyReply } from 'fastify'


type CreateTableDocumentBody = Record<string, unknown>

export function createTableDocument(
  request: FastifyRequest<{ Body: CreateTableDocumentBody }>,
  reply: FastifyReply
) {
  try {
    const _body = request.body

    return { success: true }
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
  }
}
