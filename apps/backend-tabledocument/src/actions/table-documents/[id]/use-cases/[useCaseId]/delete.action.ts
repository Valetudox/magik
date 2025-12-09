import type { FastifyRequest, FastifyReply } from 'fastify'
import { deleteUseCase as deleteUseCaseService } from '../../../../../services/usecase.service.js'

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
    if (error instanceof Error && error.message === 'Use case not found') {
      return reply.status(404).send({ error: error.message })
    }
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      reply.status(404).send({ error: 'Table document not found' })
    } else {
      reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
}
