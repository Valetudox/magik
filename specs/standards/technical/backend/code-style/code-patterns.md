# Code Patterns

## index.ts Pattern

```typescript
import cors from '@fastify/cors'
import Fastify from 'fastify'
import { PORT } from './config'
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
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' })
    fastify.log.info(`Backend running at http://localhost:${PORT}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
```

## config.ts Pattern

The `config.ts` file is the **ONLY** place where `process.env` can be accessed. All environment variables MUST be read and exported from this file.

```typescript
import { homedir } from 'node:os'
import { join } from 'node:path'
import { getPort } from '../../../config/config'

export const DATA_DIR =
  process.env.DATA_DIR ?? join(homedir(), 'Documents', '{service-data}')
export const PORT = getPort('BACKEND_{SERVICE}')
export const SOCKET_SERVER_URL =
  process.env.SOCKET_SERVER_URL ?? 'http://localhost:4001'
```

### Requirements
- MUST be the only file that accesses `process.env`
- MUST import port configuration from centralized config
- MUST export all configuration values as named constants
- SHOULD use environment variables with sensible defaults
- SHOULD use `homedir()` for user-specific paths
- All other files MUST import configuration values from this file instead of accessing `process.env` directly

## routes.ts Pattern

```typescript
import type { FastifyInstance } from 'fastify'
import { actionHandler1, actionHandler2 } from './actions/{resource}'

export function registerRoutes(fastify: FastifyInstance) {
  // Health check endpoint
  function healthHandler(_request, _reply) {
    return { status: 'ok' }
  }
  fastify.get('/health', healthHandler)

  // API endpoints
  fastify.get('/api/{resource}', listHandler)
  fastify.post('/api/{resource}', createHandler)
  fastify.get('/api/{resource}/:id', getHandler)
  fastify.patch('/api/{resource}/:id', updateHandler)
  fastify.delete('/api/{resource}/:id', deleteHandler)
}
```

### Requirements
- MUST export a `registerRoutes` function
- MUST include a `/health` endpoint that returns `{ status: 'ok' }`
- SHOULD use RESTful conventions for API endpoints
- API endpoints SHOULD be prefixed with `/api/`

## Action File Pattern

### Simple Resource Action (Collection)

```typescript
// File: src/actions/decisions/get.action.ts
// Route: GET /api/decisions

import type { FastifyRequest, FastifyReply } from 'fastify'
import { listDecisions as listDecisionsService } from '../../services/decision.service'

export async function listDecisions(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const decisions = await listDecisionsService()
    return { items: decisions, total: decisions.length }
  } catch (error: any) {
    reply.status(500).send({ error: error.message })
  }
}
```

### Action with Path Parameter

```typescript
// File: src/actions/decisions/[id]/get.action.ts
// Route: GET /api/decisions/:id

import type { FastifyRequest, FastifyReply } from 'fastify'
import { getDecisionById } from '../../../services/decision.service'

interface DecisionParams {
  id: string
}

export async function getDecision(
  request: FastifyRequest<{ Params: DecisionParams }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params
    const decision = await getDecisionById(id)

    if (!decision) {
      return reply.status(404).send({ error: 'Decision not found' })
    }

    return decision
  } catch (error: any) {
    reply.status(500).send({ error: error.message })
  }
}
```

### Action with Body and Parameter

```typescript
// File: src/actions/decisions/[id]/patch.action.ts
// Route: PATCH /api/decisions/:id

import type { FastifyRequest, FastifyReply } from 'fastify'
import { updateDecision as updateDecisionService } from '../../../services/decision.service'

interface UpdateDecisionBody {
  title?: string
  description?: string
  status?: string
}

interface DecisionParams {
  id: string
}

export async function updateDecision(
  request: FastifyRequest<{ Body: UpdateDecisionBody; Params: DecisionParams }>,
  reply: FastifyReply
) {
  try {
    const { id } = request.params
    const updates = request.body

    // Validation
    if (Object.keys(updates).length === 0) {
      return reply.status(400).send({ error: 'No updates provided' })
    }

    // Call service
    const result = await updateDecisionService(id, updates)
    return { success: true, result }
  } catch (error: any) {
    if (error.message === 'Decision not found') {
      return reply.status(404).send({ error: error.message })
    }
    reply.status(500).send({ error: error.message })
  }
}
```

### Nested Resource Action

```typescript
// File: src/actions/decisions/[id]/options/[optionId]/patch.action.ts
// Route: PATCH /api/decisions/:id/options/:optionId

import type { FastifyRequest, FastifyReply } from 'fastify'
import { updateOption as updateOptionService } from '../../../../../services/option.service'

interface UpdateOptionBody {
  title?: string
  description?: string
  pros?: string[]
  cons?: string[]
}

interface OptionParams {
  id: string
  optionId: string
}

export async function updateOption(
  request: FastifyRequest<{ Body: UpdateOptionBody; Params: OptionParams }>,
  reply: FastifyReply
) {
  try {
    const { id, optionId } = request.params
    const updates = request.body

    const result = await updateOptionService(id, optionId, updates)
    return { success: true, result }
  } catch (error: any) {
    if (error.message === 'Option not found') {
      return reply.status(404).send({ error: error.message })
    }
    reply.status(500).send({ error: error.message })
  }
}
```

### Import Path Guidelines

**Important:** Import paths change based on folder nesting depth:

| File Location | Service Import Path |
|---------------|---------------------|
| `actions/decisions/get.action.ts` | `../../services/decision.service` |
| `actions/decisions/[id]/get.action.ts` | `../../../services/decision.service` |
| `actions/decisions/[id]/options/post.action.ts` | `../../../../services/option.service` |
| `actions/decisions/[id]/options/[optionId]/patch.action.ts` | `../../../../../services/option.service` |

### Requirements
- MUST export async function with typed parameters
- MUST use `FastifyRequest` and `FastifyReply` types
- MUST define interfaces for request body/params/query
- MUST validate input and return appropriate HTTP status codes
- MUST handle errors and return proper error responses
- MUST adjust import paths based on file nesting depth

## types.ts Pattern

```typescript
export interface Resource {
  id: string
  field1: string
  field2: number
  createdAt: string
  updatedAt: string
}

export interface ResourceListResponse {
  items: Resource[]
  total: number
}

export interface ErrorResponse {
  error: string
}
```

### Requirements
- MUST export interfaces for domain entities
- SHOULD export response interfaces
- SHOULD export error response interfaces
