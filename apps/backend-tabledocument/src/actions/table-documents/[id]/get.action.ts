import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import type { z } from 'zod'
import { zGetTableDocumentData, zGetTableDocumentResponse } from '../../../generated/zod.gen.js'

export function getTableDocument(
  request: FastifyRequest<{
    Params: z.infer<typeof zGetTableDocumentData.shape.path>
    
  }, ZodTypeProvider>,
  reply: FastifyReply<ZodTypeProvider>
): Promise<z.infer<typeof zGetTableDocumentResponse>> {
  try {
    const { id: _id } = request.params

    return { success: true }
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
  }
}
