import { readFileSync } from 'node:fs'
import YAML from 'yaml'
import { camelCase, pascalCase } from 'change-case'

export interface ParsedOperation {
  operationId: string
  method: string
  path: string
  summary?: string
  description?: string
  parameters: Parameter[]
  requestBody?: RequestBody
  responses: Record<string, Response>
  tags?: string[]
}

export interface Parameter {
  name: string
  in: 'path' | 'query' | 'header'
  required: boolean
  schema: SchemaObject
  description?: string
}

export interface RequestBody {
  required: boolean
  content: Record<string, { schema: SchemaObject }>
}

export interface Response {
  description: string
  content?: Record<string, { schema: SchemaObject }>
}

export interface SchemaObject {
  type?: string
  format?: string
  enum?: string[]
  items?: SchemaObject
  properties?: Record<string, SchemaObject>
  required?: string[]
  $ref?: string
  additionalProperties?: boolean | SchemaObject
  description?: string
  nullable?: boolean
}

export interface ParsedOpenAPI {
  info: {
    title: string
    version: string
    description?: string
  }
  servers: Array<{ url: string; description?: string }>
  operations: ParsedOperation[]
  schemas: Record<string, SchemaObject>
}

export class OpenAPIParser {
  private spec: any

  constructor(specPath: string) {
    const content = readFileSync(specPath, 'utf-8')
    this.spec = YAML.parse(content)
  }

  parse(): ParsedOpenAPI {
    return {
      info: this.parseInfo(),
      servers: this.parseServers(),
      operations: this.parseOperations(),
      schemas: this.parseSchemas(),
    }
  }

  private parseInfo() {
    return {
      title: this.spec.info?.title || 'Unknown API',
      version: this.spec.info?.version || '1.0.0',
      description: this.spec.info?.description,
    }
  }

  private parseServers() {
    return this.spec.servers || []
  }

  private parseOperations(): ParsedOperation[] {
    const operations: ParsedOperation[] = []

    for (const [path, pathItem] of Object.entries(this.spec.paths || {})) {
      if (path === '/health') continue // Skip health endpoint

      for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
        const operation = (pathItem as any)[method]
        if (!operation) continue

        const operationId = operation.operationId || this.deriveOperationId(method, path)

        operations.push({
          operationId,
          method,
          path,
          summary: operation.summary,
          description: operation.description,
          parameters: this.parseParameters(operation.parameters || []),
          requestBody: this.parseRequestBody(operation.requestBody),
          responses: operation.responses || {},
          tags: operation.tags,
        })
      }
    }

    return operations
  }

  private parseParameters(params: any[]): Parameter[] {
    return params.map((param) => ({
      name: param.name,
      in: param.in,
      required: param.required || false,
      schema: param.schema || {},
      description: param.description,
    }))
  }

  private parseRequestBody(requestBody: any): RequestBody | undefined {
    if (!requestBody) return undefined

    return {
      required: requestBody.required || false,
      content: requestBody.content || {},
    }
  }

  private parseSchemas(): Record<string, SchemaObject> {
    return this.spec.components?.schemas || {}
  }

  private deriveOperationId(method: string, path: string): string {
    // Remove /api/ prefix and convert to camelCase
    // e.g., GET /api/recordings/:id -> getRecordingsId
    const pathSegments = path
      .replace(/^\/api\//, '')
      .split('/')
      .filter((s) => s !== '')
      .map((s) => {
        if (s.startsWith(':') || s.startsWith('{')) {
          // Remove : or {}, convert to word
          return s.replace(/^[:{}]/g, '').replace(/}$/g, '')
        }
        return s
      })

    const pathPart = pascalCase(pathSegments.join(' '))
    return camelCase(`${method} ${pathPart}`)
  }

  /**
   * Convert OpenAPI path to action file path
   * /api/recordings/:id (GET) → recordings/[id]/get.action.ts
   * /api/specs/{id}/sections/{sid} (POST) → specs/[id]/sections/[sid]/post.action.ts
   */
  static routeToActionPath(method: string, apiPath: string): string {
    const path = apiPath.replace(/^\/api\//, '')

    const segments = path
      .split('/')
      .filter((s) => s !== '')
      .map((segment) => {
        // Convert :id or {id} to [id]
        if (segment.startsWith(':')) {
          return `[${segment.substring(1)}]`
        }
        if (segment.startsWith('{') && segment.endsWith('}')) {
          return `[${segment.slice(1, -1)}]`
        }
        return segment
      })

    const folderPath = segments.join('/')
    const fileName = `${method.toLowerCase()}.action.ts`

    return folderPath ? `${folderPath}/${fileName}` : fileName
  }

  /**
   * Convert OpenAPI path to Fastify route path
   * /api/recordings/{id} → /api/recordings/:id
   */
  static openapiPathToFastifyPath(openapiPath: string): string {
    return openapiPath.replace(/\{(\w+)\}/g, ':$1')
  }

  /**
   * Extract path parameters from route
   * /api/recordings/:id → ['id']
   * /api/specs/:specId/sections/:sectionId → ['specId', 'sectionId']
   */
  static extractPathParams(route: string): string[] {
    const matches = route.match(/:(\w+)/g)
    return matches ? matches.map((m) => m.substring(1)) : []
  }
}
