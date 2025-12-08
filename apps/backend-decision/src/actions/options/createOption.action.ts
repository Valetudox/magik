import type { FastifyRequest, FastifyReply } from 'fastify'
import { createOption as createOptionService } from '../../services/option.service'

interface CreateOptionParams {
  id: string
}

interface CreateOptionBody {
  name: string
  description: string
  moreLink?: string
}

export async function createOption(
  request: FastifyRequest<{ Params: CreateOptionParams; Body: CreateOptionBody }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params
    const { name, description, moreLink } = request.body

    if (!name || !description) {
      return reply.status(400).send({ error: 'name and description are required' })
    }

    const option = await createOptionService(id, name, description, moreLink)
    return { success: true, option }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      reply.status(404).send({ error: 'Decision not found' })
    } else if (error instanceof Error && error.message === 'Option with this name already exists') {
      reply.status(400).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
}
