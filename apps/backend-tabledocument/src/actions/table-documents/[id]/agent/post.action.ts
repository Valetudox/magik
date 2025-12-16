import type { FastifyRequest, FastifyReply } from 'fastify'

interface RunAgentParams {
  id: string
}

type RunAgentBody = Record<string, unknown>

export function runAgent(
  request: FastifyRequest<{ Params: RunAgentParams; Body: RunAgentBody }>,
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
