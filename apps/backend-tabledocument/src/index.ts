import cors from '@fastify/cors'
import Fastify from 'fastify'
import { registerRoutes } from './routes'

const fastify = Fastify({
  logger: true,
})

await fastify.register(cors, {
  origin: true,
})

registerRoutes(fastify)
async function start() {
  try {
    const { getPort } = await import('../../../config/config.js')
    const port = getPort('BACKEND_TABLEDOCUMENT')
    await fastify.listen({ port, host: '0.0.0.0' })
    fastify.log.info(`Backend tabledocument running at http://localhost:${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

void start()
