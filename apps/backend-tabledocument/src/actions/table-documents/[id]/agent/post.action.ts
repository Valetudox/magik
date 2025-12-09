import type { FastifyRequest, FastifyReply } from 'fastify'
import { runAgent as runAgentService } from '../../../../services/agent.service.js'

interface RunAgentParams {
  id: string
}

interface RunAgentBody {
  prompt: string
}

export async function runAgent(
  request: FastifyRequest<{ Params: RunAgentParams; Body: RunAgentBody }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params
    const { prompt } = request.body

    if (!prompt || typeof prompt !== 'string') {
      return reply.status(400).send({ error: 'prompt is required' })
    }

    await runAgentService(id, prompt)
    return { success: true }
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      reply.status(404).send({ error: 'Table document not found' })
    } else {
      reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
}
