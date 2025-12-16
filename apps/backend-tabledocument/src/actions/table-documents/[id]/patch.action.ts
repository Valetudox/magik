import type { FastifyRequest, FastifyReply } from 'fastify'

interface UpdateTableDocumentParams {
  id: string
}

type UpdateTableDocumentBody = Record<string, unknown>

export function updateTableDocument(
  request: FastifyRequest<{ Params: UpdateTableDocumentParams; Body: UpdateTableDocumentBody }>,
  reply: FastifyReply
) {
  try {
    const { id: _id } = request.params
    const _body = request.body

    return { success: true }
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
  }
}
