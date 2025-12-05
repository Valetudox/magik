import type { FastifyRequest, FastifyReply } from 'fastify'
import { getSpecificationById } from '../../services/specification.service'

interface GetSpecificationParams {
  id: string
}

export async function getSpecification(
  request: FastifyRequest<{ Params: GetSpecificationParams }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { id } = request.params
    const specification = await getSpecificationById(id)
    await reply.send(specification)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      await reply.status(404).send({ error: 'Specification not found' })
    } else if (error instanceof SyntaxError) {
      await reply.status(500).send({ error: 'Failed to parse specification file' })
    } else {
      console.error('Error getting specification:', error)
      await reply.status(500).send({ error: 'Failed to read specification' })
    }
  }
}
