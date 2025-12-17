import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import type { z } from 'zod'
import { zUpdateUseCaseData, zUpdateUseCaseResponse } from '../../../../../generated/zod.gen.js'

export function updateUseCase(
  request: FastifyRequest<{
    Params: z.infer<typeof zUpdateUseCaseData.shape.path>; 
    Body: z.infer<typeof zUpdateUseCaseData.shape.body>
  }, ZodTypeProvider>,
  reply: FastifyReply<ZodTypeProvider>
): Promise<z.infer<typeof zUpdateUseCaseResponse>> {
  try {
    const { id: _id, useCaseId: _useCaseId } = request.params
    const _body = request.body

    return { success: true }
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
  }
}
