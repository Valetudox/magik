import type { FastifyRequest, FastifyReply } from 'fastify'
import { updateDecision as updateDecisionService } from '../../../services/decision.service'

type UpdateDecisionParams = {
  id: string
}

type UpdateDecisionBody = {
  problemDefinition?: string
  proposal?: { description: string; reasoning: string[] }
  confluenceLink?: string
}

export async function updateDecision(
  request: FastifyRequest<{ Params: UpdateDecisionParams; Body: UpdateDecisionBody }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params
    await updateDecisionService(id, request.body)
    return { success: true }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      reply.status(404).send({ error: 'Decision not found' })
    } else {
      reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
}
