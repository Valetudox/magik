import type { FastifyRequest, FastifyReply } from 'fastify'
import { updateDriver as updateDriverService } from '../../../../../services/driver.service'

type UpdateDriverParams = {
  id: string
  driverId: string
}

type UpdateDriverBody = {
  name: string
  description: string
}

export async function updateDriver(
  request: FastifyRequest<{ Params: UpdateDriverParams; Body: UpdateDriverBody }>,
  reply: FastifyReply
) {
  try {
    const { id, driverId } = request.params
    const { name, description } = request.body

    if (!name || !description) {
      return reply.status(400).send({ error: 'name and description are required' })
    }

    const driver = await updateDriverService(id, driverId, name, description)
    return { success: true, driver }
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
