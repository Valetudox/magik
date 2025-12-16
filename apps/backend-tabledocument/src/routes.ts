import type { FastifyInstance } from 'fastify'
import { listTableDocumentsHandler } from './actions/table-documents/get.action'
import { createTableDocumentHandler } from './actions/table-documents/post.action'
import { getTableDocumentHandler } from './actions/table-documents/[id]/get.action'
import { updateTableDocumentHandler } from './actions/table-documents/[id]/patch.action'
import { deleteTableDocumentHandler } from './actions/table-documents/[id]/delete.action'
import { createUseCaseHandler } from './actions/table-documents/[id]/use-cases/post.action'
import { updateUseCaseHandler } from './actions/table-documents/[id]/use-cases/[useCaseId]/patch.action'
import { deleteUseCaseHandler } from './actions/table-documents/[id]/use-cases/[useCaseId]/delete.action'
import { runAgentHandler } from './actions/table-documents/[id]/agent/post.action'
import { pushToConfluenceHandler } from './actions/table-documents/[id]/push-to-confluence/post.action'

export function registerRoutes(fastify: FastifyInstance) {
  fastify.get('/health', () => ({ status: 'ok' }))

  fastify.get('/api/table-documents', listTableDocumentsHandler)
  fastify.post('/api/table-documents', createTableDocumentHandler)
  fastify.get('/api/table-documents/:id', getTableDocumentHandler)
  fastify.patch('/api/table-documents/:id', updateTableDocumentHandler)
  fastify.delete('/api/table-documents/:id', deleteTableDocumentHandler)
  fastify.post('/api/table-documents/:id/use-cases', createUseCaseHandler)
  fastify.patch('/api/table-documents/:id/use-cases/:useCaseId', updateUseCaseHandler)
  fastify.delete('/api/table-documents/:id/use-cases/:useCaseId', deleteUseCaseHandler)
  fastify.post('/api/table-documents/:id/agent', runAgentHandler)
  fastify.post('/api/table-documents/:id/push-to-confluence', pushToConfluenceHandler)
}
