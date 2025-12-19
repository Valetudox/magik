import type { FastifyRequest, FastifyReply } from 'fastify'
import { deleteComponent as deleteComponentService } from '../../../../../services/component.service'

type DeleteComponentParams = {
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
