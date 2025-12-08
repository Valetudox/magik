import type { FastifyInstance } from 'fastify'
import { runAgent } from './actions/decisions/[id]/agent/post.action'
import { deleteComponent } from './actions/decisions/[id]/components/[componentId]/delete.action'
import { updateComponent } from './actions/decisions/[id]/components/[componentId]/patch.action'
import { createComponent } from './actions/decisions/[id]/components/post.action'
import { deleteDecision } from './actions/decisions/[id]/delete.action'
import { deleteDriver } from './actions/decisions/[id]/drivers/[driverId]/delete.action'
import { updateDriver } from './actions/decisions/[id]/drivers/[driverId]/patch.action'
import { createDriver } from './actions/decisions/[id]/drivers/post.action'
import { updateEvaluationDetails } from './actions/decisions/[id]/evaluations/details/patch.action'
import { updateEvaluation } from './actions/decisions/[id]/evaluations/patch.action'
import { getDecision } from './actions/decisions/[id]/get.action'
import { deleteOption } from './actions/decisions/[id]/options/[optionId]/delete.action'
import { updateOption } from './actions/decisions/[id]/options/[optionId]/patch.action'
import { createOption } from './actions/decisions/[id]/options/post.action'
import { updateDecision } from './actions/decisions/[id]/patch.action'
import { pushToConfluence } from './actions/decisions/[id]/push-to-confluence/post.action'
import { updateSelectedOption } from './actions/decisions/[id]/selected-option/patch.action'
import { deleteUseCase } from './actions/decisions/[id]/use-cases/[useCaseId]/delete.action'
import { updateUseCase } from './actions/decisions/[id]/use-cases/[useCaseId]/patch.action'
import { createUseCase } from './actions/decisions/[id]/use-cases/post.action'
import { listDecisions } from './actions/decisions/get.action'
import { createDecision } from './actions/decisions/post.action'

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
