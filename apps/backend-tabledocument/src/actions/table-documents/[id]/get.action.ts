import type { FastifyRequest, FastifyReply } from 'fastify'
import type { z } from 'zod/v4'
import { zGetTableDocumentData, zGetTableDocumentResponse } from '../../../generated/zod.gen.js'

export function getTableDocument(
  request: FastifyRequest<{
    Params: z.infer<typeof zGetTableDocumentData.shape.path>
  }>,
  reply: FastifyReply
): Promise<z.infer<typeof zGetTableDocumentResponse>> {
  try {
    const { id: _id } = request.params

    return Promise.resolve({ success: true, id: '', title: '', useCases: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
    return Promise.resolve({ success: true, id: '', title: '', useCases: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
  }
}
