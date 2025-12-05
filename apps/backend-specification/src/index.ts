import cors from '@fastify/cors'
import Fastify from 'fastify'
import { registerRoutes } from './routes'

async function start() {
  const fastify = Fastify({
    logger: true,
  })

  // Register CORS middleware
  await fastify.register(cors, {
    origin: true,
  })

  // Register routes
  registerRoutes(fastify)

  // Start server
  const port = parseInt(process.env.PORT || '4002', 10)

  try {
    await fastify.listen({ port, host: '0.0.0.0' })
    fastify.log.info(`Server listening on port ${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
