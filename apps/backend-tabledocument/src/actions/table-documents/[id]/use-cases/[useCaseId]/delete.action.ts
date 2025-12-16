import type { FastifyRequest, FastifyReply } from 'fastify'

interface DeleteUseCaseParams {
  id: string
  useCaseId: string
}

export function deleteUseCase(
  request: FastifyRequest<{ Params: DeleteUseCaseParams }>,
  reply: FastifyReply
) {
  try {
    const { id: _id, useCaseId: _useCaseId } = request.params

    return { success: true }
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
  }
}
