import type { FastifyRequest, FastifyReply } from 'fastify'
import { createDecision as createDecisionService } from '../../services/decision.service'

type CreateDecisionBody = {
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
    if (error instanceof Error && error.message === 'Invalid filename') {
      return reply.status(400).send({ error: error.message })
    }
    if (error instanceof Error && error.message === 'Decision with this name already exists') {
      return reply.status(409).send({ error: error.message })
    }
    reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
