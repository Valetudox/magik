import type { FastifyRequest, FastifyReply } from 'fastify'

interface GetTableDocumentParams {
  id: string
}

export async function getTableDocument(
  request: FastifyRequest<{ Params: GetTableDocumentParams }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params

    // TODO: Implement your logic here

    return { success: true }
  } catch (error: unknown) {
    reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
