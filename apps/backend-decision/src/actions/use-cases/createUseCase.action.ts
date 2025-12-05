import type { FastifyRequest, FastifyReply } from 'fastify'
import { createUseCase as createUseCaseService } from '../../services/useCase.service'

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
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return reply.status(404).send({ error: 'Decision not found' })
    }
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    if (errorMessage === 'Use case with this name already exists') {
      return reply.status(400).send({ error: errorMessage })
    }
    return reply.status(500).send({ error: errorMessage })
  }
}
