import type { FastifyRequest, FastifyReply } from 'fastify'
import { updateTableDocument as updateTableDocumentService } from '../../../services/tabledocument.service.js'

interface UpdateTableDocumentParams {
  id: string
}

interface UpdateTableDocumentBody {
  confluence_url?: string
}

export async function updateTableDocument(
  request: FastifyRequest<{ Params: UpdateTableDocumentParams; Body: UpdateTableDocumentBody }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params
    const updates = request.body

    await updateTableDocumentService(id, updates)
    return { success: true }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      reply.status(404).send({ error: 'Table document not found' })
    } else {
      reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
}
