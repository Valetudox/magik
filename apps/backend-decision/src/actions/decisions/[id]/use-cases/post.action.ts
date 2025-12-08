import type { FastifyRequest, FastifyReply } from 'fastify'
import { createUseCase as createUseCaseService } from '../../../../services/useCase.service'

interface CreateUseCaseParams {
  id: string
}

interface CreateUseCaseBody {
  name: string
  description: string
}

export async function createUseCase(
  request: FastifyRequest<{ Params: CreateUseCaseParams; Body: CreateUseCaseBody }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params
    const { name, description } = request.body

    if (!name || !description) {
      return reply.status(400).send({ error: 'name and description are required' })
    }

    const useCase = await createUseCaseService(id, name, description)
    return { success: true, useCase }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      reply.status(404).send({ error: 'Decision not found' })
    } else if (error instanceof Error && error.message === 'Use case with this name already exists') {
      reply.status(400).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
}
