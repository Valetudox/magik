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
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      reply.status(404).send({ error: 'Decision not found' })
    } else if (error.message === 'Option not found') {
      reply.status(400).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error.message })
    }
  }
}
