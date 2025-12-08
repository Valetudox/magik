import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { Server } from 'socket.io'
import { z } from 'zod'

const BroadcastRequestSchema = z.object({
  channel: z.string().min(1, 'Channel must not be empty'),
  payload: z.unknown().optional(),
})

interface BroadcastBody {
  channel: string
  payload?: unknown
}

const BroadcastResponseSchema = z.object({
  success: z.boolean(),
  channel: z.string(),
  clientCount: z.number(),
})

const ErrorResponseSchema = z.object({
  error: z.string(),
})

const HealthResponseSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
  connectedClients: z.number(),
})

export function registerRoutes(fastify: FastifyInstance, io: Server) {
  // Health check endpoint
  fastify.get(
    '/health',
    {
      schema: {
        response: {
          200: HealthResponseSchema,
        },
      },
    },
    function () {
      return {
        status: 'ok' as const,
        service: 'backend-socket',
        connectedClients: io.engine.clientsCount,
      }
    }
  )

  // POST /api/broadcast - Broadcast event to all Socket.IO clients
  fastify.post(
    '/api/broadcast',
    {
      schema: {
        body: BroadcastRequestSchema,
        response: {
          200: BroadcastResponseSchema,
          400: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async function (request: FastifyRequest<{ Body: BroadcastBody }>, reply: FastifyReply) {
      const { channel } = request.body
      const payload: unknown = request.body.payload

      try {
        const clientCount = io.engine.clientsCount

        // Broadcast to all connected clients
        io.emit(channel, payload)

        fastify.log.info(`Broadcasted to ${clientCount} client(s) on channel: ${channel}`)

        return {
          success: true,
          channel,
          clientCount,
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        fastify.log.error('Broadcast error:', errorMessage)
        return reply.status(500).send({ error: 'Failed to broadcast message' })
      }
    }
  )
}
