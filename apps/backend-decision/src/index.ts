import cors from '@fastify/cors'
import Fastify from 'fastify'
import { DECISIONS_DIR } from './config'
import { registerRoutes } from './routes'
import { broadcastToSocket } from './utils/broadcast'
import { fileEventToSocketPayload } from './utils/fileEventToSocketPayload'
import { setupFileWatcher } from './utils/fileWatcher'

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
const start = async () => {
  try {
    const { getPort } = await import('../../../config/config.js')
    const port = getPort('BACKEND_DECISION')
    await fastify.listen({ port, host: '0.0.0.0' })
    fastify.log.info(`Backend running at http://localhost:${port}`)

    // Setup file watcher and subscribe to changes
    const fileWatcher = setupFileWatcher(DECISIONS_DIR)

    fileWatcher.subscribe(async (event) => {
      try {
        const socketPayload = fileEventToSocketPayload(event)
        await broadcastToSocket(socketPayload)
        fastify.log.info(`Broadcasted ${event.type} for decision: ${event.id}`)
      } catch (error: any) {
        fastify.log.error(`Failed to broadcast: ${error.message}`)
      }
    })

    fastify.log.info(`Watching for file changes: ${DECISIONS_DIR}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
