import cors from '@fastify/cors'
import Fastify from 'fastify'
import { TABLE_DOCUMENTS_DIR } from './config.js'
import { registerRoutes } from './routes.js'
import { broadcastToSocket } from './utils/broadcast.js'
import { fileEventToSocketPayload } from './utils/file-event-to-socket-payload.js'
import { setupFileWatcher } from './utils/file-watcher.js'

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
    fastify.log.info(`Backend running at http://localhost:${port}`)

    const fileWatcher = setupFileWatcher(TABLE_DOCUMENTS_DIR)

    fileWatcher.subscribe(async (event) => {
      try {
        const socketPayload = fileEventToSocketPayload(event)
        await broadcastToSocket(socketPayload)
        fastify.log.info(`Broadcasted ${event.type} for table document: ${event.id}`)
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        fastify.log.error(`Failed to broadcast: ${errorMessage}`)
      }
    })

    fastify.log.info(`Watching for file changes: ${TABLE_DOCUMENTS_DIR}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

void start()
