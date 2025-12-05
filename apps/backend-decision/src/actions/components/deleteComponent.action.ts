import type { FastifyRequest, FastifyReply } from 'fastify'
import { deleteComponent as deleteComponentService } from '../../services/component.service'

interface DeleteComponentParams {
  id: string
  componentId: string
}

export async function deleteComponent(
  request: FastifyRequest<{ Params: DeleteComponentParams }>,
  reply: FastifyReply
) {
  try {
    const { id, componentId } = request.params
    await deleteComponentService(id, componentId)
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return reply.status(404).send({ error: 'Decision not found' })
    }
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    if (errorMessage === 'Component not found') {
      return reply.status(404).send({ error: errorMessage })
    }
    return reply.status(500).send({ error: errorMessage })
  }
}
