import type { FastifyRequest, FastifyReply } from 'fastify'
import { updateUseCase as updateUseCaseService } from '../../../../../services/usecase.service.js'

interface UpdateUseCaseParams {
  id: string
  useCaseId: string
}

interface UpdateUseCaseBody {
  use_case?: string
  diagram?: string
  required_context?: string[]
  required_tools?: string[]
  potential_interactions?: string[]
  notes?: string[]
}

export async function updateUseCase(
  request: FastifyRequest<{ Params: UpdateUseCaseParams; Body: UpdateUseCaseBody }>,
  reply: FastifyReply
) {
  try {
    const { id, useCaseId } = request.params
    const updates = request.body

    const updatedUseCase = await updateUseCaseService(id, useCaseId, updates)
    return { success: true, useCase: updatedUseCase }
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
