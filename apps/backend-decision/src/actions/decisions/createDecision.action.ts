import type { FastifyRequest, FastifyReply } from 'fastify'
import { createDecision as createDecisionService } from '../../services/decision.service'

interface CreateDecisionBody {
  filename: string
}

export async function createDecision(
  request: FastifyRequest<{ Body: CreateDecisionBody }>,
  reply: FastifyReply
) {
  try {
    const { filename } = request.body

    if (!filename || typeof filename !== 'string') {
      return reply.status(400).send({ error: 'filename is required' })
    }

    const id = await createDecisionService(filename)
    return { success: true, id }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    if (errorMessage === 'Invalid filename') {
      return reply.status(400).send({ error: errorMessage })
    }
    if (errorMessage === 'Decision with this name already exists') {
      return reply.status(409).send({ error: errorMessage })
    }
    return reply.status(500).send({ error: errorMessage })
  }
}
