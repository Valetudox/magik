import cors from '@fastify/cors'
import Fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { Server } from 'socket.io'
import { z } from 'zod'

const fastify = Fastify({
  logger: true,
}).withTypeProvider<ZodTypeProvider>()

// Set Zod as the validator and serializer
fastify.setValidatorCompiler(validatorCompiler)
fastify.setSerializerCompiler(serializerCompiler)

// Register CORS
await fastify.register(cors, {
  origin: true,
})

// Create Socket.IO server
const io = new Server(fastify.server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

// Socket.IO connection handling
io.on('connection', (socket) => {
  fastify.log.info(`Client connected: ${socket.id}`)

  socket.on('disconnect', () => {
    fastify.log.info(`Client disconnected: ${socket.id}`)
  })
})

// Zod schemas for validation
const BroadcastRequestSchema = z.object({
  channel: z.string().min(1, 'Channel must not be empty'),
  payload: z.any().optional(),
})

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
  async (request, reply) => {
    const { channel, payload } = request.body

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
    } catch (error: any) {
      fastify.log.error('Broadcast error:', error)
      return reply.status(500).send({ error: 'Failed to broadcast message' })
    }
  }
)

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
  async () => {
    return {
      status: 'ok' as const,
      service: 'backend-socket',
      connectedClients: io.engine.clientsCount,
    }
  }
)

// Start server
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 4001
    await fastify.listen({ port, host: '0.0.0.0' })
    fastify.log.info(`Socket.IO server running at http://localhost:${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
