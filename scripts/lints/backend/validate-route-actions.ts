#!/usr/bin/env bun

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from '@typescript-eslint/parser'
import type { CallExpression, Literal } from 'estree'

interface RouteInfo {
  method: string
  path: string
  handler: string
  expectedFile: string // Expected .action.ts file path
}

interface ActionFolder {
  path: string
  routeCount: number
  actionFileCount: number
  routes: string[]
  actionFiles: string[]
}

interface ValidationError {
  service: string
  actionFolder: string
  errorType: 'missing-folder' | 'extra-action-files' | 'missing-action-files'
  expectedCount?: number
  actualCount?: number
  extraFiles?: string[]
  missingCount?: number
  routes?: string[]
}

// ANSI color codes
const RED = '\x1b[0;31m'
const GREEN = '\x1b[0;32m'
const YELLOW = '\x1b[1;33m'
const NC = '\x1b[0m' // No Color

/**
 * Transform route to expected action file path (Next.js-style with [param] folders)
 * Examples:
 * - GET /api/decisions → actions/decisions/get.action.ts
 * - GET /api/decisions/:id → actions/decisions/[id]/get.action.ts
 * - POST /api/decisions/:id/push-to-confluence → actions/decisions/[id]/push-to-confluence/post.action.ts
 * - DELETE /api/decisions/:id/drivers/:driverId → actions/decisions/[id]/drivers/[driverId]/delete.action.ts
 * - PATCH /api/decisions/:id/options/:optionId → actions/decisions/[id]/options/[optionId]/patch.action.ts
 *
 * Rules:
 * - Static segments → Regular folders (e.g., decisions, options, drivers)
 * - Dynamic segments → Folders with brackets (e.g., [id], [optionId], [driverId])
 * - Action files → Named by HTTP method only (e.g., get.action.ts, patch.action.ts)
 */
function routeToExpectedFilePath(method: string, routePath: string): string {
  // Remove /api prefix
  let path = routePath.replace(/^\/api\//, '')

  // Split into segments
  const segments = path.split('/').filter(seg => seg !== '')

  const folderParts: string[] = []

  // Transform each segment into folder path
  for (const segment of segments) {
    if (segment.startsWith(':')) {
      // Dynamic segment: :id → [id]
      folderParts.push(`[${segment.substring(1)}]`)
    } else {
      // Static segment: decisions → decisions
      folderParts.push(segment)
    }
  }

  // Build the final path: folder/path/method.action.ts
  const folderPath = folderParts.join('/')
  const fileName = method.toLowerCase() + '.action.ts'

  return folderPath ? `${folderPath}/${fileName}` : fileName
}

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
      const handler = (node as CallExpression).arguments[1]
      const method = node.callee.property.name

      if (routePath && routePath.type === 'Literal') {
        const path = (routePath as Literal).value as string

        // Skip health check endpoints
        if (path !== '/health') {
          routes.push({
            method,
            path,
            handler: handler?.type === 'Identifier' ? handler.name : 'inline',
            expectedFile: routeToExpectedFilePath(method, path),
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
 * Check if a file exists
 */
function fileExists(filePath: string): boolean {
  try {
    return statSync(filePath).isFile()
  } catch {
    return false
  }
}

/**
 * Recursively get all .action.ts files in a directory
 */
function getAllActionFiles(dirPath: string, basePath: string = ''): string[] {
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true })
    let files: string[] = []

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name)
      const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        files = files.concat(getAllActionFiles(fullPath, relativePath))
      } else if (entry.isFile() && entry.name.endsWith('.action.ts')) {
        files.push(relativePath)
      }
    }

    return files
  } catch {
    return []
  }
}

/**
 * Validate a single backend service
 */
function validateService(
  serviceName: string,
  serviceDir: string,
): ValidationError[] {
  const errors: ValidationError[] = []
  const routesFile = join(serviceDir, 'src', 'routes.ts')
  const actionsDir = join(serviceDir, 'src', 'actions')

  // Extract routes from routes.ts
  const routes = extractRoutesFromFile(routesFile)

  // Get all actual action files
  const actualFiles = getAllActionFiles(actionsDir)
  const actualFileSet = new Set(actualFiles)

  // Build set of expected files
  const expectedFiles = new Set(routes.map((r) => r.expectedFile))

  // Find missing files (expected but not present)
  const missingFiles: RouteInfo[] = []
  for (const route of routes) {
    if (!actualFileSet.has(route.expectedFile)) {
      missingFiles.push(route)
    }
  }

  // Find extra files (present but not expected)
  const extraFiles: string[] = []
  for (const actualFile of actualFiles) {
    if (!expectedFiles.has(actualFile)) {
      extraFiles.push(actualFile)
    }
  }

  // Report errors
  if (missingFiles.length > 0) {
    for (const route of missingFiles) {
      errors.push({
        service: serviceName,
        actionFolder: `actions/${route.expectedFile}`,
        errorType: 'missing-action-files',
        routes: [`${route.method.toUpperCase()} ${route.path}`],
      })
    }
  }

  if (extraFiles.length > 0) {
    errors.push({
      service: serviceName,
      actionFolder: 'actions/',
      errorType: 'extra-action-files',
      extraFiles,
      routes: ['Unexpected files in actions directory'],
    })
  }

  return errors
}

/**
 * Main validation function
 */
function main() {
  // Check if backend name argument is provided
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.log(`${RED}Error: Backend service name argument is required${NC}`)
    console.log('Usage: validate-route-actions.ts <backend-service-name>')
    console.log('Example: validate-route-actions.ts backend-audio')
    process.exit(1)
  }

  const backendName = args[0]
  const appsDir = 'apps'
  const serviceDir = join(appsDir, backendName)

  // Validate that the backend service exists
  if (!statSync(serviceDir).isDirectory()) {
    console.log(`${RED}Error: Backend service not found: ${backendName}${NC}`)
    process.exit(1)
  }

  // Validate the specified backend service
  const errors = validateService(backendName, serviceDir)

  // Report results
  if (errors.length === 0) {
    console.log(
      `${GREEN}✓${NC} Backend service has correct route-action alignment`,
    )
    console.log(`  Validated: ${backendName}`)
    process.exit(0)
  } else {
    console.log(`${RED}✗${NC} Route-action alignment validation failed`)
    console.log('')

    console.log(`  ${backendName}:`)

    // Group missing files by type
    const missingFiles = errors.filter((e) => e.errorType === 'missing-action-files')
    const extraFilesErrors = errors.filter((e) => e.errorType === 'extra-action-files')

    if (missingFiles.length > 0) {
      console.log(`    Missing action files:`)
      for (const error of missingFiles) {
        console.log(`      - ${error.actionFolder}`)
        console.log(`        Route: ${error.routes?.[0]}`)
      }
    }

    if (extraFilesErrors.length > 0) {
      console.log(`    Extra action files:`)
      for (const error of extraFilesErrors) {
        if (error.extraFiles) {
          for (const file of error.extraFiles) {
            console.log(`      - actions/${file}`)
          }
        }
      }
    }

    console.log('')

    process.exit(1)
  }
}

main()
