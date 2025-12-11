import type { FastifyInstance } from 'fastify'
import { runAgent } from './actions/table-documents/[id]/agent/post.action.js'
import { deleteTableDocument } from './actions/table-documents/[id]/delete.action.js'
import { getTableDocument } from './actions/table-documents/[id]/get.action.js'
import { updateTableDocument } from './actions/table-documents/[id]/patch.action.js'
import { pushToConfluence } from './actions/table-documents/[id]/push-to-confluence/post.action.js'
import { deleteUseCase } from './actions/table-documents/[id]/use-cases/[useCaseId]/delete.action.js'
import { updateUseCase } from './actions/table-documents/[id]/use-cases/[useCaseId]/patch.action.js'
import { createUseCase } from './actions/table-documents/[id]/use-cases/post.action.js'
import { listTableDocuments } from './actions/table-documents/get.action.js'
import { createTableDocument } from './actions/table-documents/post.action.js'

export function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/health', () => {
    return { status: 'ok' }
  })

  fastify.get('/api/table-documents', listTableDocuments)
  fastify.post('/api/table-documents', createTableDocument)
  fastify.get('/api/table-documents/:id', getTableDocument)
  fastify.patch('/api/table-documents/:id', updateTableDocument)
  fastify.delete('/api/table-documents/:id', deleteTableDocument)

  fastify.post('/api/table-documents/:id/use-cases', createUseCase)
  fastify.patch('/api/table-documents/:id/use-cases/:useCaseId', updateUseCase)
  fastify.delete('/api/table-documents/:id/use-cases/:useCaseId', deleteUseCase)

  fastify.post('/api/table-documents/:id/agent', runAgent)

  fastify.post('/api/table-documents/:id/push-to-confluence', pushToConfluence)
}
