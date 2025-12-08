import type { FastifyRequest, FastifyReply } from 'fastify'
import { listAllDecisions } from '../../services/decision.service'

export async function listDecisions(request: FastifyRequest, reply: FastifyReply) {
  try {
    const decisions = await listAllDecisions()
    return { decisions }
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Failed to read decisions' })
  }
}
