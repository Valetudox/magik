import type { FastifyRequest, FastifyReply } from 'fastify'
import { updateEvaluationRating } from '../../../../services/evaluation.service'

interface UpdateEvaluationParams {
  id: string
}

interface UpdateEvaluationBody {
  optionId: string
  driverId: string
  rating: 'high' | 'medium' | 'low'
}

export async function updateEvaluation(
  request: FastifyRequest<{ Params: UpdateEvaluationParams; Body: UpdateEvaluationBody }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params
    const { optionId, driverId, rating } = request.body


    const evaluation = await updateEvaluationRating(id, optionId, driverId, rating)
    return { success: true, evaluation }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      reply.status(404).send({ error: 'Decision not found' })
    } else if (error instanceof Error && error.message === 'Evaluation not found') {
      reply.status(404).send({ error: error.message })
    } else if (error instanceof Error && error.message === 'rating must be high, medium, or low') {
      reply.status(400).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
}
