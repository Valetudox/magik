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
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      reply.status(404).send({ error: 'Decision not found' })
    } else if (error.message === 'Component not found') {
      reply.status(404).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error.message })
    }
  }
}
