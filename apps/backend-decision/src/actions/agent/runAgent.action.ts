import type { FastifyRequest, FastifyReply } from 'fastify'
import { runAgent as runAgentService } from '../../services/agent.service'

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

    if (!prompt) {
      return reply.status(400).send({ error: 'prompt is required' })
    }

    request.log.info(`Running agent for decision ${id} with prompt: ${prompt}`)

    await runAgentService(id, prompt)

    request.log.info(`Successfully updated decision ${id} with agent`)

    // File watcher will detect the change and broadcast via Socket.IO
    return {
      success: true,
      message: 'Decision updated successfully',
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      reply.status(404).send({ error: 'Decision not found' })
    } else {
      request.log.error(`Agent error: ${error.message}`)
      reply.status(500).send({ error: error.message || 'Failed to process with agent' })
    }
  }
}
