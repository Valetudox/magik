import type { FastifyRequest, FastifyReply } from 'fastify'
import { listAllSpecifications } from '../../services/specification.service'

export async function listSpecifications(request: FastifyRequest, reply: FastifyReply) {
  try {
    const specifications = await listAllSpecifications()
    return { specifications }
  } catch (error) {
    console.error('Error listing specifications:', error)
    reply.status(500).send({ error: 'Failed to read specifications' })
  }
}
