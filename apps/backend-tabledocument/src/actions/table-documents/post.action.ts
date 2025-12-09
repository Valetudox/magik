import type { FastifyRequest, FastifyReply } from 'fastify'
import { createTableDocument as createTableDocumentService } from '../../services/tabledocument.service.js'

interface CreateTableDocumentBody {
  filename: string
}

export async function createTableDocument(
  request: FastifyRequest<{ Body: CreateTableDocumentBody }>,
  reply: FastifyReply
) {
  try {
    const { filename } = request.body

    if (!filename || typeof filename !== 'string') {
      return reply.status(400).send({ error: 'filename is required' })
    }

    const id = await createTableDocumentService(filename)
    return { success: true, id }
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Invalid path') {
      return reply.status(400).send({ error: error.message })
    }
    if (error instanceof Error && error.message === 'Table document with this name already exists') {
      return reply.status(409).send({ error: error.message })
    }
    reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
