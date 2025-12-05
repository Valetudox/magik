import type { FastifyRequest, FastifyReply } from 'fastify'
import { updateEvaluationRating } from '../../services/evaluation.service'

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

    if (!optionId || !driverId || !rating) {
      return reply.status(400).send({ error: 'optionId, driverId, and rating are required' })
    }

    const evaluation = await updateEvaluationRating(id, optionId, driverId, rating)
    return { success: true, evaluation }
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return reply.status(404).send({ error: 'Decision not found' })
    }
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    if (errorMessage === 'Evaluation not found') {
      return reply.status(404).send({ error: errorMessage })
    }
    if (errorMessage === 'rating must be high, medium, or low') {
      return reply.status(400).send({ error: errorMessage })
    }
    return reply.status(500).send({ error: errorMessage })
  }
}
