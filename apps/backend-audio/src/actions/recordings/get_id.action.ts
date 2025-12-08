import type { FastifyReply, FastifyRequest } from 'fastify'
import { getRecordingById } from '../../services/recordings.service'

export async function getRecordingHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply,
) {
  try {
    const { id } = request.params
    const recording = await getRecordingById(id)

    if (!recording) {
      return reply.status(404).send({
        error: 'Recording not found',
        message: `No recording found with id: ${id}`,
      })
    }

    return reply.send(recording)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return reply.status(500).send({
      error: 'Failed to get recording',
      message,
    })
  }
}
