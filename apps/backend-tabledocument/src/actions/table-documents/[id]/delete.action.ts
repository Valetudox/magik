import type { FastifyRequest, FastifyReply } from 'fastify'
import type { z } from 'zod/v4'
import { zDeleteTableDocumentData, zDeleteTableDocumentResponse } from '../../../generated/zod.gen.js'

export function deleteTableDocument(
  request: FastifyRequest<{
    Params: z.infer<typeof zDeleteTableDocumentData.shape.path>
  }>,
  reply: FastifyReply
): Promise<z.infer<typeof zDeleteTableDocumentResponse>> {
  try {
    const { id: _id } = request.params

    return Promise.resolve(undefined)
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
    return Promise.resolve(undefined)
  }
}
