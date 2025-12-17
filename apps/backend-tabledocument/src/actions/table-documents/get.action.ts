import type { FastifyRequest, FastifyReply } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import type { z } from 'zod'
import { zListTableDocumentsResponse } from '../../generated/zod.gen.js'

export function listTableDocuments(
  request: FastifyRequest<Record<string, never>, ZodTypeProvider>,
  reply: FastifyReply<ZodTypeProvider>
): Promise<z.infer<typeof zListTableDocumentsResponse>> {
  try {

    return { success: true }
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
  }
}
