import type { FastifyRequest, FastifyReply } from 'fastify'
import { listAllSpecifications } from '../../services/specification.service'

export async function listSpecifications(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const specifications = await listAllSpecifications()
    await reply.send({ specifications })
  } catch (error) {
    console.error('Error listing specifications:', error)
    await reply.status(500).send({ error: 'Failed to read specifications' })
  }
}
