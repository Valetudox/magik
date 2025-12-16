import type { FastifyRequest, FastifyReply } from 'fastify'

interface UpdateUseCaseParams {
  id: string
  useCaseId: string
}

type UpdateUseCaseBody = Record<string, unknown>

export function updateUseCase(
  request: FastifyRequest<{ Params: UpdateUseCaseParams; Body: UpdateUseCaseBody }>,
  reply: FastifyReply
) {
  try {
    const { id: _id, useCaseId: _useCaseId } = request.params
    const _body = request.body

    return { success: true }
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
  }
}
