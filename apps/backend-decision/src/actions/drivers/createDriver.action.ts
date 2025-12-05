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
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      reply.status(404).send({ error: 'Decision not found' })
    } else if (error.message === 'Driver with this name already exists') {
      reply.status(400).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error.message })
    }
  }
}
