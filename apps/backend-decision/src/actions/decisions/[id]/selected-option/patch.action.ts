import type { FastifyRequest, FastifyReply } from 'fastify'
import { updateSelectedOption as updateSelectedOptionService } from '../../../../services/decision.service'

type UpdateSelectedOptionParams = {
  id: string
}

type UpdateSelectedOptionBody = {
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
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      reply.status(404).send({ error: 'Decision not found' })
    } else if (error instanceof Error && error.message === 'Option not found') {
      reply.status(400).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
}
