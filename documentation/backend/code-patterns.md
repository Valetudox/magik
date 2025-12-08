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

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify'
import { serviceFunction } from '../services/{resource}.service'

interface RequestBody {
  field: string
}

interface RequestParams {
  id: string
}

export async function actionName(
  request: FastifyRequest<{ Body: RequestBody; Params: RequestParams }>,
  reply: FastifyReply
) {
  try {
    const { field } = request.body
    const { id } = request.params

    // Validation
    if (!field || typeof field !== 'string') {
      return reply.status(400).send({ error: 'field is required' })
    }

    // Call service
    const result = await serviceFunction(id, field)
    return { success: true, result }
  } catch (error: any) {
    // Handle specific errors
    if (error.message === 'Specific error') {
      return reply.status(400).send({ error: error.message })
    }
    reply.status(500).send({ error: error.message })
  }
}
```

### Requirements
- MUST export async function with typed parameters
- MUST use `FastifyRequest` and `FastifyReply` types
- SHOULD define interfaces for request body/params
- SHOULD validate input and return appropriate HTTP status codes
- SHOULD handle errors and return proper error responses

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
