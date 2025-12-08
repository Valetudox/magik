import cors from '@fastify/cors'
import Fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { Server } from 'socket.io'
import { PORT } from './config'
import { registerRoutes } from './routes'

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

// Register routes
registerRoutes(fastify, io)

// Start server
async function start() {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' })
    fastify.log.info(`Socket.IO server running at http://localhost:${PORT}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

void start()
