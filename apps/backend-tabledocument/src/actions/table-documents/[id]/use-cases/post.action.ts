import type { FastifyRequest, FastifyReply } from 'fastify'

interface CreateUseCaseParams {
  id: string
}

type CreateUseCaseBody = Record<string, unknown>

export function createUseCase(
  request: FastifyRequest<{ Params: CreateUseCaseParams; Body: CreateUseCaseBody }>,
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
