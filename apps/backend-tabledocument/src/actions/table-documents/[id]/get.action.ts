import type { FastifyRequest, FastifyReply } from 'fastify'

interface GetTableDocumentParams {
  id: string
}

export function getTableDocument(
  request: FastifyRequest<{ Params: GetTableDocumentParams }>,
  reply: FastifyReply
) {
  try {
    const { id: _id } = request.params

    return { success: true }
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
  }
}
