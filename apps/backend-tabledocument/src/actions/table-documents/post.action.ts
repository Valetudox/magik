import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import type { z } from 'zod'
import { zCreateTableDocumentData, zCreateTableDocumentResponse } from '../../generated/zod.gen.js'

export function createTableDocument(
  request: FastifyRequest<{
    
    Body: z.infer<typeof zCreateTableDocumentData.shape.body>
  }, ZodTypeProvider>,
  reply: FastifyReply<ZodTypeProvider>
): Promise<z.infer<typeof zCreateTableDocumentResponse>> {
  try {
    const _body = request.body

    return { success: true }
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
  }
}
