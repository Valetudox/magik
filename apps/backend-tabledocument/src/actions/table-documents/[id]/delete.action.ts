import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import type { z } from 'zod'
import { zDeleteTableDocumentData, zDeleteTableDocumentResponse } from '../../../generated/zod.gen.js'

export function deleteTableDocument(
  request: FastifyRequest<{
    Params: z.infer<typeof zDeleteTableDocumentData.shape.path>
    
  }, ZodTypeProvider>,
  reply: FastifyReply<ZodTypeProvider>
): Promise<z.infer<typeof zDeleteTableDocumentResponse>> {
  try {
    const { id: _id } = request.params

    return { success: true }
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
  }
}
