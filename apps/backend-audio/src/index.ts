import cors from '@fastify/cors'
import Fastify from 'fastify'
import { PORT } from './config'
import { registerRoutes } from './routes'

// Start server
async function start() {
  const fastify = Fastify({
    logger: true,
  })

  // Register CORS
  await fastify.register(cors, {
    origin: true,
  })

  // Register all routes
  registerRoutes(fastify)

  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' })
    fastify.log.info(`Backend Audio API running at http://localhost:${PORT}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

void start()
