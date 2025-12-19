import type { FastifyRequest, FastifyReply } from 'fastify'
import { updateEvaluationDetails as updateEvaluationDetailsService } from '../../../../../services/evaluation.service'

type UpdateEvaluationDetailsParams = {
  id: string
}

type UpdateEvaluationDetailsBody = {
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
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      reply.status(404).send({ error: 'Decision not found' })
    } else if (error instanceof Error && error.message === 'Evaluation not found') {
      reply.status(404).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
}
