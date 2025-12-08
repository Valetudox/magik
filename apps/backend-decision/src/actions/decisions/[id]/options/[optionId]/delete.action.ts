import type { FastifyRequest, FastifyReply } from 'fastify'
import { deleteOption as deleteOptionService } from '../../../../../services/option.service'

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
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      reply.status(404).send({ error: 'Decision not found' })
    } else if (error instanceof Error && error.message === 'Option not found') {
      reply.status(404).send({ error: error.message })
    } else {
      reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }
}
