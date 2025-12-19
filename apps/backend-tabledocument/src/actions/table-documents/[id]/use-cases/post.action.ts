import type { FastifyRequest, FastifyReply } from 'fastify'
import type { z } from 'zod/v4'
import { zCreateUseCaseData, zCreateUseCaseResponse } from '../../../../generated/zod.gen.js'

export function createUseCase(
  request: FastifyRequest<{
    Params: z.infer<typeof zCreateUseCaseData.shape.path>
    Body: z.infer<typeof zCreateUseCaseData.shape.body>
  }>,
  reply: FastifyReply
): Promise<z.infer<typeof zCreateUseCaseResponse>> {
  try {
    const { id: _id } = request.params
    const _body = request.body

    return Promise.resolve({ success: true, id: '', title: '' })
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
    return Promise.resolve({ success: false, id: '', title: '' })
  }
}
