import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { Server } from 'socket.io'
import { z } from 'zod'
import { broadcastHandler } from './actions/broadcast/post.action'

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
    async (request: FastifyRequest<{ Body: BroadcastBody }>, reply: FastifyReply) =>
      broadcastHandler(io, request, reply)
  )
}
