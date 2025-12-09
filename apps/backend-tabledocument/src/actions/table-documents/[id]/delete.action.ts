import type { FastifyRequest, FastifyReply } from 'fastify'
import { deleteTableDocument as deleteTableDocumentService } from '../../../services/tabledocument.service.js'

interface DeleteTableDocumentParams {
  id: string
}

export async function deleteTableDocument(
  request: FastifyRequest<{ Params: DeleteTableDocumentParams }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params
    await deleteTableDocumentService(id)
    return { success: true }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      reply.status(404).send({ error: 'Table document not found' })
    } else {
      reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
}
