import type { FastifyRequest, FastifyReply } from 'fastify'
import type { z } from 'zod/v4'
import { zListTableDocumentsResponse } from '../../generated/zod.gen.js'

export function listTableDocuments(
  _request: FastifyRequest,
  reply: FastifyReply
): Promise<z.infer<typeof zListTableDocumentsResponse>> {
  try {

    return Promise.resolve([])
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Internal server error' })
    return Promise.resolve([])
  }
}
