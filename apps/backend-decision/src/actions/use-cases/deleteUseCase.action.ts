import type { FastifyRequest, FastifyReply } from 'fastify'
import { deleteUseCase as deleteUseCaseService } from '../../services/useCase.service'

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
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return reply.status(404).send({ error: 'Decision not found' })
    }
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    if (errorMessage === 'Use case not found') {
      return reply.status(404).send({ error: errorMessage })
    }
    return reply.status(500).send({ error: errorMessage })
  }
}
