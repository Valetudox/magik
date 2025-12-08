import type { FastifyRequest, FastifyReply } from 'fastify'
import { deleteDecision as deleteDecisionService } from '../../../services/decision.service'

interface DeleteDecisionParams {
  id: string
}

export async function deleteDecision(
  request: FastifyRequest<{ Params: DeleteDecisionParams }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params
    await deleteDecisionService(id)
    return { success: true }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      reply.status(404).send({ error: 'Decision not found' })
    } else {
      reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
}
