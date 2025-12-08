import type { FastifyReply, FastifyRequest } from 'fastify'
import { listRecordings } from '../../services/recordings.service'
import type { RecordingListResponse } from '../../types'

export async function listRecordingsHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const recordings = await listRecordings()

    const response: RecordingListResponse = {
      recordings,
      total: recordings.length,
    }

    return reply.send(response)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return reply.status(500).send({
      error: 'Failed to list recordings',
      message,
    })
  }
}
