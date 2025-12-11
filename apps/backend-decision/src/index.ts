import cors from '@fastify/cors'
import Fastify from 'fastify'
import { DECISIONS_DIR } from './config'
import { registerRoutes } from './routes'
import { broadcastToSocket } from './utils/broadcast'
import { fileEventToSocketPayload } from './utils/file-event-to-socket-payload'
import { setupFileWatcher } from './utils/file-watcher'

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
    const port = getPort('BACKEND_DECISION')
    await fastify.listen({ port, host: '0.0.0.0' })
    fastify.log.info(`Backend running at http://localhost:${port}`)

    const fileWatcher = setupFileWatcher(DECISIONS_DIR)

    fileWatcher.subscribe(async (event) => {
      try {
        const socketPayload = fileEventToSocketPayload(event)
        await broadcastToSocket(socketPayload)
        fastify.log.info(`Broadcasted ${event.type} for decision: ${event.id}`)
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        fastify.log.error(`Failed to broadcast: ${errorMessage}`)
      }
    })

    fastify.log.info(`Watching for file changes: ${DECISIONS_DIR}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

void start()
