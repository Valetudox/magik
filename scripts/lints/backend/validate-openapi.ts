#!/usr/bin/env bun

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parse as parseYAML } from 'yaml'
import { parse } from '@typescript-eslint/parser'
import type { CallExpression, Literal } from 'estree'

interface OpenAPIDocument {
  openapi?: string
  info?: {
    title?: string
    version?: string
    description?: string
  }
  paths?: Record<string, any>
  components?: any
  servers?: any[]
}

interface RouteInfo {
  method: string
  path: string
}

interface ValidationError {
  service: string
  errorType:
    | 'yaml-syntax'
    | 'missing-openapi-version'
    | 'missing-info'
    | 'missing-paths'
    | 'invalid-openapi-version'
    | 'route-not-in-openapi'
    | 'openapi-not-in-routes'
  message: string
  details?: string
}

// ANSI color codes
const RED = '\x1b[0;31m'
const GREEN = '\x1b[0;32m'
const YELLOW = '\x1b[1;33m'
const NC = '\x1b[0m' // No Color

/**
 * Extract route definitions from routes.ts file
 */
function extractRoutesFromFile(routesFilePath: string): RouteInfo[] {
  const content = readFileSync(routesFilePath, 'utf-8')
  const ast = parse(content, {
    ecmaVersion: 'latest',
    sourceType: 'module',
    loc: true,
  })

  const routes: RouteInfo[] = []

  // Traverse AST to find fastify method calls
  function traverse(node: any) {
    if (!node) return

    // Look for fastify.get/post/patch/delete/put calls
    if (
      node.type === 'CallExpression' &&
      node.callee?.type === 'MemberExpression' &&
      node.callee.object?.name === 'fastify' &&
      node.callee.property?.name &&
      ['get', 'post', 'patch', 'delete', 'put'].includes(
        node.callee.property.name,
      )
    ) {
      const routePath = (node as CallExpression).arguments[0]
      const method = node.callee.property.name

      if (routePath && routePath.type === 'Literal') {
        const path = (routePath as Literal).value as string

        // Skip health check endpoints
        if (path !== '/health') {
          routes.push({
            method: method.toUpperCase(),
            path,
          })
        }
      }
    }

    // Recursively traverse child nodes
    for (const key in node) {
      if (node[key] && typeof node[key] === 'object') {
        if (Array.isArray(node[key])) {
          node[key].forEach(traverse)
        } else {
          traverse(node[key])
        }
      }
    }
  }

  traverse(ast)
  return routes
}

/**
 * Normalize route path from Express/Fastify format to OpenAPI format
 * Example: /api/decisions/:id -> /api/decisions/{id}
 */
function normalizeRoutePath(path: string): string {
  return path.replace(/:(\w+)/g, '{$1}')
}

/**
 * Parse and validate OpenAPI YAML file
 */
function validateOpenAPIFile(
  serviceName: string,
  openapiFilePath: string,
  routesFilePath: string,
): ValidationError[] {
  const errors: ValidationError[] = []

  // Read and parse YAML
  let openapi: OpenAPIDocument
  try {
    const yamlContent = readFileSync(openapiFilePath, 'utf-8')
    openapi = parseYAML(yamlContent) as OpenAPIDocument
  } catch (error) {
    errors.push({
      service: serviceName,
      errorType: 'yaml-syntax',
      message: 'Invalid YAML syntax',
      details: error instanceof Error ? error.message : String(error),
    })
    return errors
  }

  // Validate OpenAPI version
  if (!openapi.openapi) {
    errors.push({
      service: serviceName,
      errorType: 'missing-openapi-version',
      message: 'Missing required field: openapi',
    })
  } else if (!openapi.openapi.startsWith('3.')) {
    errors.push({
      service: serviceName,
      errorType: 'invalid-openapi-version',
      message: `Invalid OpenAPI version: ${openapi.openapi}`,
      details: 'Expected OpenAPI 3.x specification',
    })
  }

  // Validate info section
  if (!openapi.info) {
    errors.push({
      service: serviceName,
      errorType: 'missing-info',
      message: 'Missing required section: info',
    })
  } else {
    if (!openapi.info.title) {
      errors.push({
        service: serviceName,
        errorType: 'missing-info',
        message: 'Missing required field: info.title',
      })
    }
    if (!openapi.info.version) {
      errors.push({
        service: serviceName,
        errorType: 'missing-info',
        message: 'Missing required field: info.version',
      })
    }
  }

  // Validate paths section
  if (!openapi.paths) {
    errors.push({
      service: serviceName,
      errorType: 'missing-paths',
      message: 'Missing required section: paths',
    })
    return errors // Can't validate routes if no paths section
  }

  // Extract routes from routes.ts
  const routes = extractRoutesFromFile(routesFilePath)

  // Build sets for comparison
  const openapiPaths = new Map<string, Set<string>>()
  for (const [path, methods] of Object.entries(openapi.paths)) {
    // Skip health check endpoints
    if (path === '/health') {
      continue
    }

    const methodSet = new Set<string>()
    for (const method of Object.keys(methods)) {
      if (['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
        methodSet.add(method.toUpperCase())
      }
    }
    openapiPaths.set(path, methodSet)
  }

  const routePaths = new Map<string, Set<string>>()
  for (const route of routes) {
    const normalizedPath = normalizeRoutePath(route.path)
    if (!routePaths.has(normalizedPath)) {
      routePaths.set(normalizedPath, new Set())
    }
    routePaths.get(normalizedPath)!.add(route.method)
  }

  // Check for routes defined in routes.ts but missing in openapi.yaml
  for (const [path, methods] of routePaths.entries()) {
    if (!openapiPaths.has(path)) {
      for (const method of methods) {
        errors.push({
          service: serviceName,
          errorType: 'route-not-in-openapi',
          message: `Route defined in routes.ts but missing in openapi.yaml`,
          details: `${method} ${path}`,
        })
      }
    } else {
      const openapiMethods = openapiPaths.get(path)!
      for (const method of methods) {
        if (!openapiMethods.has(method)) {
          errors.push({
            service: serviceName,
            errorType: 'route-not-in-openapi',
            message: `Route method defined in routes.ts but missing in openapi.yaml`,
            details: `${method} ${path}`,
          })
        }
      }
    }
  }

  // Check for paths defined in openapi.yaml but missing in routes.ts
  for (const [path, methods] of openapiPaths.entries()) {
    if (!routePaths.has(path)) {
      for (const method of methods) {
        errors.push({
          service: serviceName,
          errorType: 'openapi-not-in-routes',
          message: `Path defined in openapi.yaml but missing in routes.ts`,
          details: `${method} ${path}`,
        })
      }
    } else {
      const routeMethods = routePaths.get(path)!
      for (const method of methods) {
        if (!routeMethods.has(method)) {
          errors.push({
            service: serviceName,
            errorType: 'openapi-not-in-routes',
            message: `Path method defined in openapi.yaml but missing in routes.ts`,
            details: `${method} ${path}`,
          })
        }
      }
    }
  }

  return errors
}

/**
 * Main validation function
 */
function main() {
  const appsDir = 'apps'
  const backendServices: string[] = []

  // Find all backend-* directories
  const dirs = readdirSync(appsDir)
  for (const dir of dirs) {
    if (dir.startsWith('backend-') && statSync(join(appsDir, dir)).isDirectory()) {
      backendServices.push(dir)
    }
  }

  let allErrors: ValidationError[] = []

  // Validate each service
  for (const service of backendServices) {
    const serviceDir = join(appsDir, service)
    const openapiFile = join(serviceDir, 'openapi.yaml')
    const routesFile = join(serviceDir, 'src', 'routes.ts')

    // Skip services without openapi.yaml (like backend-socket might not have one)
    try {
      statSync(openapiFile)
    } catch {
      continue
    }

    const errors = validateOpenAPIFile(service, openapiFile, routesFile)
    allErrors = allErrors.concat(errors)
  }

  // Report results
  if (allErrors.length === 0) {
    console.log(
      `${GREEN}✓${NC} All backend services have valid OpenAPI documentation`,
    )
    const servicesWithOpenAPI = backendServices.filter((service) => {
      try {
        statSync(join(appsDir, service, 'openapi.yaml'))
        return true
      } catch {
        return false
      }
    })
    console.log(
      `  Validated ${servicesWithOpenAPI.length} service(s): ${servicesWithOpenAPI.join(', ')}`,
    )
    process.exit(0)
  } else {
    console.log(`${RED}✗${NC} OpenAPI validation failed`)
    console.log('')

    // Group errors by service
    const errorsByService = new Map<string, ValidationError[]>()
    for (const error of allErrors) {
      if (!errorsByService.has(error.service)) {
        errorsByService.set(error.service, [])
      }
      errorsByService.get(error.service)!.push(error)
    }

    // Print errors grouped by service
    for (const [service, errors] of errorsByService.entries()) {
      console.log(`  ${service}:`)

      // Group by error type
      const errorsByType = new Map<string, ValidationError[]>()
      for (const error of errors) {
        if (!errorsByType.has(error.errorType)) {
          errorsByType.set(error.errorType, [])
        }
        errorsByType.get(error.errorType)!.push(error)
      }

      // Print errors by type
      for (const [errorType, typeErrors] of errorsByType.entries()) {
        switch (errorType) {
          case 'yaml-syntax':
            console.log(`    ${YELLOW}YAML Syntax Errors:${NC}`)
            for (const error of typeErrors) {
              console.log(`      - ${error.message}`)
              if (error.details) {
                console.log(`        ${error.details}`)
              }
            }
            break
          case 'missing-openapi-version':
          case 'invalid-openapi-version':
          case 'missing-info':
          case 'missing-paths':
            console.log(`    ${YELLOW}Schema Validation Errors:${NC}`)
            for (const error of typeErrors) {
              console.log(`      - ${error.message}`)
              if (error.details) {
                console.log(`        ${error.details}`)
              }
            }
            break
          case 'route-not-in-openapi':
            console.log(`    ${YELLOW}Routes missing from OpenAPI:${NC}`)
            for (const error of typeErrors) {
              console.log(`      - ${error.details}`)
            }
            break
          case 'openapi-not-in-routes':
            console.log(`    ${YELLOW}OpenAPI paths missing from routes.ts:${NC}`)
            for (const error of typeErrors) {
              console.log(`      - ${error.details}`)
            }
            break
        }
      }

      console.log('')
    }

    process.exit(1)
  }
}

main()
