import type { FastifyRequest, FastifyReply } from 'fastify'
import { deleteDriver as deleteDriverService } from '../../../services/driver.service'

interface DeleteDriverParams {
  id: string
  driverId: string
}

export async function deleteDriver(
  request: FastifyRequest<{ Params: DeleteDriverParams }>,
  reply: FastifyReply
) {
  try {
    const { id, driverId } = request.params
    await deleteDriverService(id, driverId)
    return { success: true }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      reply.status(404).send({ error: 'Decision not found' })
    } else if (error instanceof Error && error.message === 'Driver not found') {
      reply.status(404).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
}
