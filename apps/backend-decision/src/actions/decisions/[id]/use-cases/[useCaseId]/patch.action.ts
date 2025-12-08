import type { FastifyRequest, FastifyReply } from 'fastify'
import { updateUseCase as updateUseCaseService } from '../../../../../services/useCase.service'

interface UpdateUseCaseParams {
  id: string
  useCaseId: string
}

interface UpdateUseCaseBody {
  name: string
  description: string
}

export async function updateUseCase(
  request: FastifyRequest<{ Params: UpdateUseCaseParams; Body: UpdateUseCaseBody }>,
  reply: FastifyReply
) {
  try {
    const { id, useCaseId } = request.params
    const { name, description } = request.body

    if (!name || !description) {
      return reply.status(400).send({ error: 'name and description are required' })
    }

    const useCase = await updateUseCaseService(id, useCaseId, name, description)
    return { success: true, useCase }
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
