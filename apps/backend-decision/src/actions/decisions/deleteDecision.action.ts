import type { FastifyRequest, FastifyReply } from 'fastify'
import { deleteDecision as deleteDecisionService } from '../../services/decision.service'

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
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return reply.status(404).send({ error: 'Decision not found' })
    }
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    return reply.status(500).send({ error: errorMessage })
  }
}
