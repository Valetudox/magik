import type { FastifyRequest, FastifyReply } from 'fastify'

interface DeleteUseCaseParams {
  id: string
  useCaseId: string
}

export async function deleteUseCase(
  request: FastifyRequest<{ Params: DeleteUseCaseParams }>,
  reply: FastifyReply
) {
  try {
    const { id, useCaseId } = request.params

    // TODO: Implement your delete logic here

    return { success: true }
  } catch (error: unknown) {
    reply.status(500).send({ error: error instanceof Error ? error.message : 'Unknown error' })
  }
}
