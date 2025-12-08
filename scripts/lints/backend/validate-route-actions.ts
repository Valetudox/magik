#!/usr/bin/env bun

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from '@typescript-eslint/parser'
import type { CallExpression, Literal } from 'estree'

interface RouteInfo {
  method: string
  path: string
  handler: string
}

interface ImportInfo {
  handlers: string[]
  folder: string
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
 * Extract import statements from routes.ts to determine action folders
 */
function extractImportsFromFile(routesFilePath: string): ImportInfo[] {
  const content = readFileSync(routesFilePath, 'utf-8')
  const ast = parse(content, {
    ecmaVersion: 'latest',
    sourceType: 'module',
    loc: true,
  })

  const imports: ImportInfo[] = []

  // Traverse AST to find import statements from ./actions
  function traverse(node: any) {
    if (!node) return

    if (node.type === 'ImportDeclaration') {
      const source = node.source?.value
      if (typeof source === 'string' && source.startsWith('./actions/')) {
        const folder = source.replace('./actions/', '')
        const handlers: string[] = []

        // Extract imported handler names
        for (const specifier of node.specifiers || []) {
          if (specifier.type === 'ImportSpecifier' && specifier.imported?.name) {
            handlers.push(specifier.imported.name)
          }
        }

        if (handlers.length > 0) {
          imports.push({ handlers, folder })
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
  return imports
}

/**
 * Count .action.ts files in a directory (excluding index.ts)
 */
function countActionFiles(dirPath: string): { count: number; files: string[] } {
  try {
    const files = readdirSync(dirPath)
    const actionFiles = files.filter(
      (file) => file.endsWith('.action.ts') && file !== 'index.ts',
    )
    return { count: actionFiles.length, files: actionFiles }
  } catch {
    return { count: 0, files: [] }
  }
}

/**
 * Check if a directory exists
 */
function directoryExists(dirPath: string): boolean {
  try {
    return statSync(dirPath).isDirectory()
  } catch {
    return false
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

  // Extract imports to get the expected folder structure
  const imports = extractImportsFromFile(routesFile)

  // Validate each imported action folder
  for (const importInfo of imports) {
    // Handle imports from .action.ts files - they should be folders instead
    let folderPath = importInfo.folder
    if (folderPath.endsWith('.action')) {
      folderPath = folderPath.replace(/\.action$/, '')
    }

    const fullActionPath = join(actionsDir, folderPath)
    const expectedHandlerCount = importInfo.handlers.length

    // Check if folder exists
    if (!directoryExists(fullActionPath)) {
      errors.push({
        service: serviceName,
        actionFolder: `actions/${folderPath}`,
        errorType: 'missing-folder',
        routes: [`Import: ${importInfo.handlers.join(', ')} (from ${importInfo.folder})`],
      })
      continue
    }

    // Count action files
    const { count: actionFileCount, files: actionFiles } =
      countActionFiles(fullActionPath)

    // Check if counts match
    if (actionFileCount > expectedHandlerCount) {
      errors.push({
        service: serviceName,
        actionFolder: `actions/${folderPath}`,
        errorType: 'extra-action-files',
        expectedCount: expectedHandlerCount,
        actualCount: actionFileCount,
        extraFiles: actionFiles.slice(expectedHandlerCount),
        routes: [`Handlers: ${importInfo.handlers.join(', ')}`],
      })
    } else if (actionFileCount < expectedHandlerCount) {
      errors.push({
        service: serviceName,
        actionFolder: `actions/${folderPath}`,
        errorType: 'missing-action-files',
        expectedCount: expectedHandlerCount,
        actualCount: actionFileCount,
        missingCount: expectedHandlerCount - actionFileCount,
        routes: [`Handlers: ${importInfo.handlers.join(', ')}`],
      })
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

  // Skip backend-socket (uses inline handlers)
  const servicesToValidate = backendServices.filter(
    (service) => service !== 'backend-socket',
  )

  let allErrors: ValidationError[] = []

  // Validate each service
  for (const service of servicesToValidate) {
    const serviceDir = join(appsDir, service)
    const errors = validateService(service, serviceDir)
    allErrors = allErrors.concat(errors)
  }

  // Report results
  if (allErrors.length === 0) {
    console.log(
      `${GREEN}✓${NC} All backend services have correct route-action alignment`,
    )
    console.log(`  Validated ${servicesToValidate.length} service(s): ${servicesToValidate.join(', ')}`)
    process.exit(0)
  } else {
    console.log(`${RED}✗${NC} Route-action alignment validation failed`)
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

      for (const error of errors) {
        switch (error.errorType) {
          case 'missing-folder':
            console.log(`    - Missing action folder: ${error.actionFolder}`)
            console.log(
              `      Routes expecting this folder: ${error.routes?.join(', ')}`,
            )
            break

          case 'extra-action-files':
            console.log(
              `    - Extra action files in ${error.actionFolder}:`,
            )
            console.log(
              `      Expected: ${error.expectedCount} file(s) (${error.routes?.length} route(s))`,
            )
            console.log(`      Actual: ${error.actualCount} file(s)`)
            if (error.extraFiles && error.extraFiles.length > 0) {
              console.log(
                `      Extra files: ${error.extraFiles.join(', ')}`,
              )
            }
            break

          case 'missing-action-files':
            console.log(
              `    - Missing action files in ${error.actionFolder}:`,
            )
            console.log(
              `      Expected: ${error.expectedCount} file(s) (${error.routes?.length} route(s))`,
            )
            console.log(`      Actual: ${error.actualCount} file(s)`)
            console.log(
              `      Missing: ${error.missingCount} action file(s)`,
            )
            break
        }
      }

      console.log('')
    }

    process.exit(1)
  }
}

main()
