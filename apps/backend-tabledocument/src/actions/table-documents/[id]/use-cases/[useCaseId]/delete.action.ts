import type { FastifyRequest, FastifyReply } from 'fastify'
import type { z } from 'zod/v4'
import { zDeleteUseCaseData, zDeleteUseCaseResponse } from '../../../../../generated/zod.gen.js'

export function deleteUseCase(
  request: FastifyRequest<{
    Params: z.infer<typeof zDeleteUseCaseData.shape.path>
  }>,
  reply: FastifyReply
): Promise<z.infer<typeof zDeleteUseCaseResponse>> {
  try {
    const { id: _id, useCaseId: _useCaseId } = request.params

    return Promise.resolve(undefined)
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
    return Promise.resolve(undefined)
  }
}
