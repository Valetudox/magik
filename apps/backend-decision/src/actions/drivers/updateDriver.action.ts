import type { FastifyRequest, FastifyReply } from 'fastify'
import { updateDriver as updateDriverService } from '../../services/driver.service'

interface UpdateDriverParams {
  id: string
  driverId: string
}

interface UpdateDriverBody {
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
