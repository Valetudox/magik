import type { FastifyRequest, FastifyReply } from 'fastify'
import type { z } from 'zod/v4'
import { zPushToConfluenceData, zPushToConfluenceResponse } from '../../../../generated/zod.gen.js'

export function pushToConfluence(
  request: FastifyRequest<{
    Params: z.infer<typeof zPushToConfluenceData.shape.path>
    Body: z.infer<typeof zPushToConfluenceData.shape.body>
  }>,
  reply: FastifyReply
): Promise<z.infer<typeof zPushToConfluenceResponse>> {
  try {
    const { id: _id } = request.params
    const _body = request.body

    return Promise.resolve({ success: true })
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
    return Promise.resolve({ success: false })
  }
}
