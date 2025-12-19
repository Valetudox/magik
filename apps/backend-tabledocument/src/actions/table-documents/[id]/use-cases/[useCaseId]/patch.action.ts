import type { FastifyRequest, FastifyReply } from 'fastify'
import type { z } from 'zod/v4'
import { zUpdateUseCaseData, zUpdateUseCaseResponse } from '../../../../../generated/zod.gen.js'

export function updateUseCase(
  request: FastifyRequest<{
    Params: z.infer<typeof zUpdateUseCaseData.shape.path>
    Body: z.infer<typeof zUpdateUseCaseData.shape.body>
  }>,
  reply: FastifyReply
): Promise<z.infer<typeof zUpdateUseCaseResponse>> {
  try {
    const { id: _id, useCaseId: _useCaseId } = request.params
    const _body = request.body

    return Promise.resolve({ success: true, id: '', title: '' })
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
    return Promise.resolve({ success: false, id: '', title: '' })
  }
}
