import type { FastifyRequest, FastifyReply } from 'fastify'

interface PushToConfluenceParams {
  id: string
}

type PushToConfluenceBody = Record<string, unknown>

export function pushToConfluence(
  request: FastifyRequest<{ Params: PushToConfluenceParams; Body: PushToConfluenceBody }>,
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
