import type { FastifyRequest, FastifyReply } from 'fastify'
import { createDriver as createDriverService } from '../../services/driver.service'

interface CreateDriverParams {
  id: string
}

interface CreateDriverBody {
  name: string
  description: string
}

export async function createDriver(
  request: FastifyRequest<{ Params: CreateDriverParams; Body: CreateDriverBody }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params
    const { name, description } = request.body

    if (!name || !description) {
      return reply.status(400).send({ error: 'name and description are required' })
    }

    const driver = await createDriverService(id, name, description)
    return { success: true, driver }
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return reply.status(404).send({ error: 'Decision not found' })
    }
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    if (errorMessage === 'Driver with this name already exists') {
      return reply.status(400).send({ error: errorMessage })
    }
    return reply.status(500).send({ error: errorMessage })
  }
}
