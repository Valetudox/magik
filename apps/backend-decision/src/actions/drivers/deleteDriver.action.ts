import type { FastifyRequest, FastifyReply } from 'fastify'
import { deleteDriver as deleteDriverService } from '../../services/driver.service'

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
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return reply.status(404).send({ error: 'Decision not found' })
    }
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    if (errorMessage === 'Driver not found') {
      return reply.status(404).send({ error: errorMessage })
    }
    return reply.status(500).send({ error: errorMessage })
  }
}
