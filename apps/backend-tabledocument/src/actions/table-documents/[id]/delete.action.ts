import type { FastifyRequest, FastifyReply } from 'fastify'

interface DeleteTableDocumentParams {
  id: string
}

export function deleteTableDocument(
  request: FastifyRequest<{ Params: DeleteTableDocumentParams }>,
  reply: FastifyReply
) {
  try {
    const { id: _id } = request.params

    return { success: true }
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
  }
}
