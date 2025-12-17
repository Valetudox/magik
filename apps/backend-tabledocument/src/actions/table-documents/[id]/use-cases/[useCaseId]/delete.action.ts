import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import type { z } from 'zod'
import { zDeleteUseCaseData, zDeleteUseCaseResponse } from '../../../../../generated/zod.gen.js'

export function deleteUseCase(
  request: FastifyRequest<{
    Params: z.infer<typeof zDeleteUseCaseData.shape.path>
    
  }, ZodTypeProvider>,
  reply: FastifyReply<ZodTypeProvider>
): Promise<z.infer<typeof zDeleteUseCaseResponse>> {
  try {
    const { id: _id, useCaseId: _useCaseId } = request.params

    return { success: true }
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
  }
}
