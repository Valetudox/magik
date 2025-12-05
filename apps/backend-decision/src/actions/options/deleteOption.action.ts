import type { FastifyRequest, FastifyReply } from 'fastify'
import { deleteOption as deleteOptionService } from '../../services/option.service'

interface DeleteOptionParams {
  id: string
  optionId: string
}

export async function deleteOption(
  request: FastifyRequest<{ Params: DeleteOptionParams }>,
  reply: FastifyReply
) {
  try {
    const { id, optionId } = request.params
    await deleteOptionService(id, optionId)
    return { success: true }
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return reply.status(404).send({ error: 'Decision not found' })
    }
    const errorMessage = error instanceof Error ? error.message : 'An error occurred'
    if (errorMessage === 'Option not found') {
      return reply.status(404).send({ error: errorMessage })
    }
    return reply.status(500).send({ error: errorMessage })
  }
}
