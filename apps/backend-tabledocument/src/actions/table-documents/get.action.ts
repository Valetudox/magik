import type { FastifyRequest, FastifyReply } from 'fastify'

export async function listTableDocuments(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // TODO: Implement your logic here

    return { success: true }
  } catch (error: unknown) {
    reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
