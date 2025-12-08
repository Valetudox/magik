import type { FastifyRequest, FastifyReply } from 'fastify'
import { deleteUseCase as deleteUseCaseService } from '../../../../../services/useCase.service'

interface DeleteUseCaseParams {
  id: string
  useCaseId: string
}

export async function deleteUseCase(
  request: FastifyRequest<{ Params: DeleteUseCaseParams }>,
  reply: FastifyReply
) {
  try {
    const { id, useCaseId } = request.params
    await deleteUseCaseService(id, useCaseId)
    return { success: true }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      reply.status(404).send({ error: 'Decision not found' })
    } else if (error instanceof Error && error.message === 'Use case not found') {
      reply.status(404).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
}
