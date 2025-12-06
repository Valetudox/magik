import type { FastifyRequest, FastifyReply } from 'fastify'
import { getSpecificationById } from '../../services/specification.service'

interface GetSpecificationParams {
  id: string
}

export async function getSpecification(
  request: FastifyRequest<{ Params: GetSpecificationParams }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params
    const specification = await getSpecificationById(id)
    return specification
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      reply.status(404).send({ error: 'Specification not found' })
    } else if (error instanceof SyntaxError) {
      reply.status(500).send({ error: 'Failed to parse specification file' })
    } else {
      console.error('Error getting specification:', error)
      reply.status(500).send({ error: 'Failed to read specification' })
    }
  }
}
