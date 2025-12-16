import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import type { z } from 'zod'
import { zCreateUseCaseData, zCreateUseCaseResponse } from '../../../../generated/zod.gen.js'

export function createUseCase(
  request: FastifyRequest<{
    Params: z.infer<typeof zCreateUseCaseData.shape.path>; 
    Body: z.infer<typeof zCreateUseCaseData.shape.body>
  }, ZodTypeProvider>,
  reply: FastifyReply<ZodTypeProvider>
): Promise<z.infer<typeof zCreateUseCaseResponse>> {
  try {
    const { id: _id } = request.params
    const _body = request.body

    return { success: true }
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
  }
}
