import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import type { z } from 'zod'
import { zPushToConfluenceData, zPushToConfluenceResponse } from '../../../../generated/zod.gen.js'

export function pushToConfluence(
  request: FastifyRequest<{
    Params: z.infer<typeof zPushToConfluenceData.shape.path>; 
    Body: z.infer<typeof zPushToConfluenceData.shape.body>
  }, ZodTypeProvider>,
  reply: FastifyReply<ZodTypeProvider>
): Promise<z.infer<typeof zPushToConfluenceResponse>> {
  try {
    const { id: _id } = request.params
    const _body = request.body

    return { success: true }
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
  }
}
