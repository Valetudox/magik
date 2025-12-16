import type { FastifyRequest, FastifyReply } from 'fastify'

interface DeleteTableDocumentParams {
  id: string
}

export async function deleteTableDocument(
  request: FastifyRequest<{ Params: DeleteTableDocumentParams }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params

    // TODO: Implement your delete logic here

    return { success: true }
  } catch (error: unknown) {
    reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
