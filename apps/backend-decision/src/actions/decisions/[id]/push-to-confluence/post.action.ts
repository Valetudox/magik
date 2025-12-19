import type { FastifyRequest, FastifyReply } from 'fastify'
import { pushToConfluence as pushToConfluenceService } from '../../../../services/confluence.service'

type PushToConfluenceParams = {
  id: string
}

type PushToConfluenceBody = {
  confluenceUrl: string
}

export async function pushToConfluence(
  request: FastifyRequest<{ Params: PushToConfluenceParams; Body: PushToConfluenceBody }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params
    const { confluenceUrl } = request.body

    if (!confluenceUrl) {
      return reply.status(400).send({ error: 'confluenceUrl is required' })
    }

    const result = await pushToConfluenceService(id, confluenceUrl)

    if (result.success) {
      return reply.send({
        success: true,
        message: result.message,
        output: result.output,
      })
    } else {
      return reply.status(500).send({
        error: result.error,
        details: result.details,
      })
    }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      reply.status(404).send({ error: 'Decision not found' })
    } else if (error instanceof Error && (error.message.includes('JIRA_USERNAME') || error.message.includes('JIRA_TOKEN'))) {
      reply.status(500).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
}
