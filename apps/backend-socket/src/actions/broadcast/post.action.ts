import type { FastifyRequest, FastifyReply } from 'fastify'
import type { Server } from 'socket.io'

interface BroadcastBody {
  channel: string
  payload?: unknown
}

export async function broadcastHandler(
  io: Server,
  request: FastifyRequest<{ Body: BroadcastBody }>,
  reply: FastifyReply,
) {
  const { channel } = request.body
  const payload: unknown = request.body.payload

  try {
    const clientCount = io.engine.clientsCount

    io.emit(channel, payload)

    request.log.info(`Broadcasted to ${clientCount} client(s) on channel: ${channel}`)

    return {
      success: true,
      channel,
      clientCount,
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    request.log.error('Broadcast error:', errorMessage)
    return reply.status(500).send({ error: 'Failed to broadcast message' })
  }
}
