import type { FastifyRequest, FastifyReply } from 'fastify'
import { updateEvaluationDetails as updateEvaluationDetailsService } from '../../services/evaluation.service'

interface UpdateEvaluationDetailsParams {
  id: string
}

interface UpdateEvaluationDetailsBody {
  optionId: string
  driverId: string
  evaluationDetails: string[]
}

export async function updateEvaluationDetails(
  request: FastifyRequest<{
    Params: UpdateEvaluationDetailsParams
    Body: UpdateEvaluationDetailsBody
  }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params
    const { optionId, driverId, evaluationDetails } = request.body

    if (!optionId || !driverId || !Array.isArray(evaluationDetails)) {
      return reply
        .status(400)
        .send({ error: 'optionId, driverId, and evaluationDetails are required' })
    }

    const evaluation = await updateEvaluationDetailsService(
      id,
      optionId,
      driverId,
      evaluationDetails
    )
    return { success: true, evaluation }
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return reply.status(404).send({ error: 'Decision not found' })
    }
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    if (errorMessage === 'Evaluation not found') {
      return reply.status(404).send({ error: errorMessage })
    }
    return reply.status(500).send({ error: errorMessage })
  }
}
