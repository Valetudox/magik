import type { FastifyRequest, FastifyReply } from 'fastify'
import { createComponent as createComponentService } from '../../services/component.service'

interface CreateComponentParams {
  id: string
}

interface CreateComponentBody {
  name: string
  description: string
}

export async function createComponent(
  request: FastifyRequest<{ Params: CreateComponentParams; Body: CreateComponentBody }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params
    const { name, description } = request.body

    if (!name || !description) {
      return reply.status(400).send({ error: 'name and description are required' })
    }

    const component = await createComponentService(id, name, description)
    return { success: true, component }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      reply.status(404).send({ error: 'Decision not found' })
    } else if (error instanceof Error && error.message === 'Component with this name already exists') {
      reply.status(400).send({ error: error.message })
    } else {
      const errorMessage = error instanceof Error ? error.message : 'Internal server error'
      reply.status(500).send({ error: errorMessage })
    }
  }
}
