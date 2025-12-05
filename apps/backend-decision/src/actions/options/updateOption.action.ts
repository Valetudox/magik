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
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return reply.status(404).send({ error: 'Decision not found' })
    }
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    if (errorMessage === 'Option not found') {
      return reply.status(404).send({ error: errorMessage })
    }
    return reply.status(500).send({ error: errorMessage })
  }
}
