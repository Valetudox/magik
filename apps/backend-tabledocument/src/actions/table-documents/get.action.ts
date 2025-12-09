import type { FastifyRequest, FastifyReply } from 'fastify'
import { listAllTableDocuments } from '../../services/tabledocument.service.js'

export async function listTableDocuments(request: FastifyRequest, reply: FastifyReply) {
  try {
    const documents = await listAllTableDocuments()
    return { documents }
  } catch (_error: unknown) {
    reply.status(500).send({ error: 'Failed to read table documents' })
  }
}
