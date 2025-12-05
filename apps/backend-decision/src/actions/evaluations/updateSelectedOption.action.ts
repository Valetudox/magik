import type { FastifyRequest, FastifyReply } from 'fastify'
import { updateSelectedOption as updateSelectedOptionService } from '../../services/decision.service'

interface UpdateSelectedOptionParams {
  id: string
}

interface UpdateSelectedOptionBody {
  optionId: string | null
}

export async function updateSelectedOption(
  request: FastifyRequest<{ Params: UpdateSelectedOptionParams; Body: UpdateSelectedOptionBody }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params
    const { optionId } = request.body

    const selectedOption = await updateSelectedOptionService(id, optionId)
    return { success: true, selectedOption }
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return reply.status(404).send({ error: 'Decision not found' })
    }
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    if (errorMessage === 'Option not found') {
      return reply.status(400).send({ error: errorMessage })
    }
    return reply.status(500).send({ error: errorMessage })
  }
}
