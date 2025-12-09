import type { FastifyRequest, FastifyReply } from 'fastify'
import { getTableDocumentById } from '../../../services/tabledocument.service.js'

interface GetTableDocumentParams {
  id: string
}

export async function getTableDocument(
  request: FastifyRequest<{ Params: GetTableDocumentParams }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params
    const document = await getTableDocumentById(id)
    return document
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      reply.status(404).send({ error: 'Table document not found' })
    } else {
      reply.status(500).send({ error: 'Failed to read table document' })
    }
  }
}
