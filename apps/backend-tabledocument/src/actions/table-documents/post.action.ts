import type { FastifyRequest, FastifyReply } from 'fastify'
import type { z } from 'zod/v4'
import { zCreateTableDocumentData, zCreateTableDocumentResponse } from '../../generated/zod.gen.js'

export function createTableDocument(
  request: FastifyRequest<{
    Body: z.infer<typeof zCreateTableDocumentData.shape.body>
  }>,
  reply: FastifyReply
): Promise<z.infer<typeof zCreateTableDocumentResponse>> {
  try {
    const _body = request.body

    return Promise.resolve({ success: true, id: '', title: '', useCases: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
    return Promise.resolve({ success: true, id: '', title: '', useCases: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
  }
}
