import type { FastifyRequest, FastifyReply } from 'fastify'
import type { z } from 'zod/v4'
import { zUpdateTableDocumentData, zUpdateTableDocumentResponse } from '../../../generated/zod.gen.js'

export function updateTableDocument(
  request: FastifyRequest<{
    Params: z.infer<typeof zUpdateTableDocumentData.shape.path>
    Body: z.infer<typeof zUpdateTableDocumentData.shape.body>
  }>,
  reply: FastifyReply
): Promise<z.infer<typeof zUpdateTableDocumentResponse>> {
  try {
    const { id: _id } = request.params
    const _body = request.body

    return Promise.resolve({ success: true, id: '', title: '', useCases: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
    return Promise.resolve({ success: true, id: '', title: '', useCases: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
  }
}
