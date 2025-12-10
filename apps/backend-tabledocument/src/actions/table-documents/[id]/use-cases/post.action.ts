import type { TableRow } from '@magik/tabledocuments'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { createUseCase as createUseCaseService } from '../../../../services/usecase.service.js'

interface CreateUseCaseParams {
  id: string
}

interface CreateUseCaseBody {
  use_case: string
  diagram?: string
  required_context?: string[]
  required_tools?: string[]
  potential_interactions?: string[]
  notes?: string[]
}

export async function createUseCase(
  request: FastifyRequest<{ Params: CreateUseCaseParams; Body: CreateUseCaseBody }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params
    const useCaseData = request.body

    if (!useCaseData.use_case || typeof useCaseData.use_case !== 'string') {
      return reply.status(400).send({ error: 'use_case is required' })
    }

    const newUseCase = await createUseCaseService(id, useCaseData as Omit<TableRow, 'id'>)
    return { success: true, useCase: newUseCase }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      reply.status(404).send({ error: 'Table document not found' })
    } else {
      reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
}
