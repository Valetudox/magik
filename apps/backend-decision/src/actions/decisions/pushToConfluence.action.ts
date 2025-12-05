import type { FastifyRequest, FastifyReply } from 'fastify'
import { pushToConfluence as pushToConfluenceService } from '../../services/confluence.service'

interface PushToConfluenceParams {
  id: string
}

interface PushToConfluenceBody {
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
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return reply.status(404).send({ error: 'Decision not found' })
    }
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    if (errorMessage.includes('JIRA_USERNAME') || errorMessage.includes('JIRA_TOKEN')) {
      return reply.status(500).send({ error: errorMessage })
    }
    return reply.status(500).send({ error: errorMessage })
  }
}
