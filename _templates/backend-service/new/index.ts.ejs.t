---
to: apps/backend-<%= serviceName %>/src/index.ts
---
import cors from '@fastify/cors'
import Fastify from 'fastify'
import { registerRoutes } from './routes'

const fastify = Fastify({
  logger: true,
})

// Register CORS
await fastify.register(cors, {
  origin: true,
})

// Register all routes
registerRoutes(fastify)

// Start server
async function start() {
  try {
    const { getPort } = await import('../../../config/config.js')
    const port = getPort('BACKEND_<%= h.changeCase.constantCase(serviceName) %>')
    await fastify.listen({ port, host: '0.0.0.0' })
    fastify.log.info(`Backend <%= serviceName %> running at http://localhost:${port}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

void start()
