import type { FastifyRequest, FastifyReply } from 'fastify'
import { updateOption as updateOptionService } from '../../services/option.service'

interface UpdateOptionParams {
  id: string
  optionId: string
}

interface UpdateOptionBody {
  name: string
  description: string
  moreLink?: string
}

export async function updateOption(
  request: FastifyRequest<{ Params: UpdateOptionParams; Body: UpdateOptionBody }>,
  reply: FastifyReply
) {
  try {
    const { id, optionId } = request.params
    const { name, description, moreLink } = request.body

    if (!name || !description) {
      return reply.status(400).send({ error: 'name and description are required' })
    }

    const option = await updateOptionService(id, optionId, name, description, moreLink)
    return { success: true, option }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      reply.status(404).send({ error: 'Decision not found' })
    } else if (error instanceof Error && error.message === 'Option not found') {
      reply.status(404).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
}
