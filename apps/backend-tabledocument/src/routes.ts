import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
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
import { zCreateTableDocumentData, zCreateTableDocumentResponse, zCreateUseCaseData, zCreateUseCaseResponse, zDeleteTableDocumentData, zDeleteTableDocumentResponse, zDeleteUseCaseData, zDeleteUseCaseResponse, zGetTableDocumentData, zGetTableDocumentResponse, zListTableDocumentsData, zListTableDocumentsResponse, zPushToConfluenceData, zPushToConfluenceResponse, zRunAgentData, zRunAgentResponse, zUpdateTableDocumentData, zUpdateTableDocumentResponse, zUpdateUseCaseData, zUpdateUseCaseResponse } from './generated/zod.gen.js'

export function registerRoutes(fastify: FastifyInstance) {
  const typedFastify = fastify.withTypeProvider<ZodTypeProvider>()

  typedFastify.get('/health', () => ({ status: 'ok' }))

  typedFastify.get('/api/table-documents', {
    schema: {
          body: zListTableDocumentsData.shape.body,
          params: zListTableDocumentsData.shape.path,
          querystring: zListTableDocumentsData.shape.query,
          response: {
            200: zListTableDocumentsResponse
          }
        }
  }, listTableDocuments)

  typedFastify.post('/api/table-documents', {
    schema: {
          body: zCreateTableDocumentData.shape.body,
          params: zCreateTableDocumentData.shape.path,
          querystring: zCreateTableDocumentData.shape.query,
          response: {
            200: zCreateTableDocumentResponse
          }
        }
  }, createTableDocument)

  typedFastify.get('/api/table-documents/:id', {
    schema: {
          body: zGetTableDocumentData.shape.body,
          params: zGetTableDocumentData.shape.path,
          querystring: zGetTableDocumentData.shape.query,
          response: {
            200: zGetTableDocumentResponse
          }
        }
  }, getTableDocument)

  typedFastify.patch('/api/table-documents/:id', {
    schema: {
          body: zUpdateTableDocumentData.shape.body,
          params: zUpdateTableDocumentData.shape.path,
          querystring: zUpdateTableDocumentData.shape.query,
          response: {
            200: zUpdateTableDocumentResponse
          }
        }
  }, updateTableDocument)

  typedFastify.delete('/api/table-documents/:id', {
    schema: {
          body: zDeleteTableDocumentData.shape.body,
          params: zDeleteTableDocumentData.shape.path,
          querystring: zDeleteTableDocumentData.shape.query,
          response: {
            200: zDeleteTableDocumentResponse
          }
        }
  }, deleteTableDocument)

  typedFastify.post('/api/table-documents/:id/use-cases', {
    schema: {
          body: zCreateUseCaseData.shape.body,
          params: zCreateUseCaseData.shape.path,
          querystring: zCreateUseCaseData.shape.query,
          response: {
            200: zCreateUseCaseResponse
          }
        }
  }, createUseCase)

  typedFastify.patch('/api/table-documents/:id/use-cases/:useCaseId', {
    schema: {
          body: zUpdateUseCaseData.shape.body,
          params: zUpdateUseCaseData.shape.path,
          querystring: zUpdateUseCaseData.shape.query,
          response: {
            200: zUpdateUseCaseResponse
          }
        }
  }, updateUseCase)

  typedFastify.delete('/api/table-documents/:id/use-cases/:useCaseId', {
    schema: {
          body: zDeleteUseCaseData.shape.body,
          params: zDeleteUseCaseData.shape.path,
          querystring: zDeleteUseCaseData.shape.query,
          response: {
            200: zDeleteUseCaseResponse
          }
        }
  }, deleteUseCase)

  typedFastify.post('/api/table-documents/:id/agent', {
    schema: {
          body: zRunAgentData.shape.body,
          params: zRunAgentData.shape.path,
          querystring: zRunAgentData.shape.query,
          response: {
            200: zRunAgentResponse
          }
        }
  }, runAgent)

  typedFastify.post('/api/table-documents/:id/push-to-confluence', {
    schema: {
          body: zPushToConfluenceData.shape.body,
          params: zPushToConfluenceData.shape.path,
          querystring: zPushToConfluenceData.shape.query,
          response: {
            200: zPushToConfluenceResponse
          }
        }
  }, pushToConfluence)
}
