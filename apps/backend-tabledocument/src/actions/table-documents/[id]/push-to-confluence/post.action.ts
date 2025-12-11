import type { FastifyRequest, FastifyReply } from 'fastify'
import { pushToConfluence as pushToConfluenceService } from '../../../../services/confluence.service.js'
import { getTableDocumentById } from '../../../../services/tabledocument.service.js'

interface PushToConfluenceParams {
  id: string
}

export async function pushToConfluence(
  request: FastifyRequest<{ Params: PushToConfluenceParams }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params

    const document = await getTableDocumentById(id)

    await pushToConfluenceService(document)

    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('does not have a Confluence URL')) {
      return reply.status(400).send({ error: error.message })
    }
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      reply.status(404).send({ error: 'Table document not found' })
    } else {
      reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
}
