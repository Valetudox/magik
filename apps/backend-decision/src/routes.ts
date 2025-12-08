import type { FastifyInstance } from 'fastify'
import {
  listDecisions,
  createDecision,
  getDecision,
  deleteDecision,
  updateDecision,
  pushToConfluence,
  updateEvaluation,
  updateEvaluationDetails,
  updateSelectedOption,
  createOption,
  updateOption,
  deleteOption,
  createDriver,
  updateDriver,
  deleteDriver,
  createComponent,
  updateComponent,
  deleteComponent,
  createUseCase,
  updateUseCase,
  deleteUseCase,
  runAgent,
} from './actions/decisions'

export function registerRoutes(fastify: FastifyInstance) {
  // Health check endpoint
  fastify.get('/health', () => {
    return { status: 'ok' }
  })

  // Decision endpoints
  fastify.get('/api/decisions', listDecisions)
  fastify.post('/api/decisions', createDecision)
  fastify.get('/api/decisions/:id', getDecision)
  fastify.delete('/api/decisions/:id', deleteDecision)
  fastify.patch('/api/decisions/:id', updateDecision)
  fastify.post('/api/decisions/:id/push-to-confluence', pushToConfluence)

  // Evaluation endpoints
  fastify.patch('/api/decisions/:id/evaluations', updateEvaluation)
  fastify.patch('/api/decisions/:id/evaluations/details', updateEvaluationDetails)
  fastify.patch('/api/decisions/:id/selected-option', updateSelectedOption)

  // Options endpoints
  fastify.post('/api/decisions/:id/options', createOption)
  fastify.patch('/api/decisions/:id/options/:optionId', updateOption)
  fastify.delete('/api/decisions/:id/options/:optionId', deleteOption)

  // Drivers endpoints
  fastify.post('/api/decisions/:id/drivers', createDriver)
  fastify.patch('/api/decisions/:id/drivers/:driverId', updateDriver)
  fastify.delete('/api/decisions/:id/drivers/:driverId', deleteDriver)

  // Components endpoints
  fastify.post('/api/decisions/:id/components', createComponent)
  fastify.patch('/api/decisions/:id/components/:componentId', updateComponent)
  fastify.delete('/api/decisions/:id/components/:componentId', deleteComponent)

  // Use cases endpoints
  fastify.post('/api/decisions/:id/use-cases', createUseCase)
  fastify.patch('/api/decisions/:id/use-cases/:useCaseId', updateUseCase)
  fastify.delete('/api/decisions/:id/use-cases/:useCaseId', deleteUseCase)

  // Agent endpoint
  fastify.post('/api/decisions/:id/agent', runAgent)
}
