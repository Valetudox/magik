import type { FastifyRequest, FastifyReply } from 'fastify'
import { getDecisionById } from '../../services/decision.service'

interface GetDecisionParams {
  id: string
}

export async function getDecision(
  request: FastifyRequest<{ Params: GetDecisionParams }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params
    const decision = await getDecisionById(id)
    return decision
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return reply.status(404).send({ error: 'Decision not found' })
    }
    return reply.status(500).send({ error: 'Failed to read decision' })
  }
}
