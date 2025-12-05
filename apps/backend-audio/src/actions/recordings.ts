import type { FastifyRequest, FastifyReply } from 'fastify'
import { listRecordings, getRecordingById } from '../services/recordings'
import type { RecordingListResponse } from '../types'

export async function listRecordingsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const recordings = await listRecordings()

    const response: RecordingListResponse = {
      recordings,
      total: recordings.length,
    }

    reply.send(response)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    reply.status(500).send({
      error: 'Failed to list recordings',
      message,
    })
  }
}

export async function getRecordingHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params
    const recording = await getRecordingById(id)

    if (!recording) {
      reply.status(404).send({
        error: 'Recording not found',
        message: `No recording found with id: ${id}`,
      })
      return
    }

    reply.send(recording)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    reply.status(500).send({
      error: 'Failed to get recording',
      message,
    })
  }
}
