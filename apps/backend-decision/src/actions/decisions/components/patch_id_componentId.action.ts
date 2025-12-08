import type { FastifyRequest, FastifyReply } from 'fastify'
import { updateComponent as updateComponentService } from '../../../services/component.service'

interface UpdateComponentParams {
  id: string
  componentId: string
}

interface UpdateComponentBody {
  name: string
  description: string
}

export async function updateComponent(
  request: FastifyRequest<{ Params: UpdateComponentParams; Body: UpdateComponentBody }>,
  reply: FastifyReply
) {
  try {
    const { id, componentId } = request.params
    const { name, description } = request.body

    if (!name || !description) {
      return reply.status(400).send({ error: 'name and description are required' })
    }

    const component = await updateComponentService(id, componentId, name, description)
    return { success: true, component }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      reply.status(404).send({ error: 'Decision not found' })
    } else if (error instanceof Error && error.message === 'Component not found') {
      reply.status(404).send({ error: error.message })
    } else {
      const errorMessage = error instanceof Error ? error.message : 'Internal server error'
      reply.status(500).send({ error: errorMessage })
    }
  }
}
