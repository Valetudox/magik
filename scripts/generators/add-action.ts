#!/usr/bin/env bun

import { Command } from 'commander'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { execSync } from 'node:child_process'
import { OpenAPIParser } from './openapi-parser'
import { camelCase } from 'change-case'

const program = new Command()
const rootDir = resolve(dirname(new URL(import.meta.url).pathname), '..', '..')

program
  .name('add-action')
  .description('Add a new action to an existing backend service and update routes.ts')
  .version('1.0.0')

program
  .requiredOption('-s, --service <name>', 'Service name (e.g., backend-decision)')
  .requiredOption('-r, --route <route>', 'API route (e.g., /api/decisions/:id/export)')
  .requiredOption('-m, --method <method>', 'HTTP method (get, post, patch, delete, put)')
  .option('-f, --function-name <name>', 'Function name (camelCase, auto-generated if not provided)')
  .action(async (options) => {
    try {
      console.log('⚡ Adding new action...\n')

      const serviceName = options.service
      const route = options.route
      const method = options.method.toLowerCase()
      const functionName = options.functionName || deriveFunctionName(method, route)

      // Step 1: Validate service exists
      console.log('📋 Step 1: Validating...')
      validateService(serviceName)
      console.log('✅ Service exists\n')

      // Step 2: Generate action file
      console.log('🏗️  Step 2: Generating action file...')
      generateAction(serviceName, route, method, functionName)
      console.log('✅ Action file created\n')

      // Step 3: Update routes.ts
      console.log('🔗 Step 3: Updating routes.ts...')
      updateRoutesFile(serviceName, route, method, functionName)
      console.log('✅ Routes updated\n')

      // Step 4: Show what was added
      const actionPath = OpenAPIParser.routeToActionPath(method, route)
      console.log('✨ Action added successfully!\n')
      console.log(`📁 Action file: apps/${serviceName}/src/actions/${actionPath}`)
      console.log(`🔗 Route registered: ${method.toUpperCase()} ${route}`)
      console.log(`🎯 Handler: ${functionName}Handler\n`)
      console.log('💡 Next steps:')
      console.log('   1. Implement the action logic in the generated file')
      console.log('   2. Update the OpenAPI spec if needed')
      console.log('   3. Run linters: bun run lint --backends ' + serviceName + '\n')
    } catch (error) {
      console.error('❌ Failed to add action:', (error as Error).message)
      process.exit(1)
    }
  })

function validateService(serviceName: string) {
  const servicePath = join(rootDir, 'apps', serviceName)
  if (!existsSync(servicePath)) {
    throw new Error(`Service ${serviceName} does not exist at ${servicePath}`)
  }

  const routesPath = join(servicePath, 'src', 'routes.ts')
  if (!existsSync(routesPath)) {
    throw new Error(`routes.ts not found at ${routesPath}`)
  }
}

function deriveFunctionName(method: string, route: string): string {
  // Remove /api/ and convert to camelCase
  // e.g., POST /api/decisions/:id/export -> exportDecision
  const pathSegments = route
    .replace(/^\/api\//, '')
    .split('/')
    .filter((s) => s !== '')
    .map((s) => {
      if (s.startsWith(':')) {
        return s.substring(1)
      }
      return s
    })

  // For POST/PUT/PATCH, use the last segment as the action
  // For GET/DELETE, use the resource name
  if (['post', 'put', 'patch'].includes(method)) {
    const lastSegment = pathSegments[pathSegments.length - 1]
    const resourceSegment = pathSegments[0]
    return camelCase(`${lastSegment} ${resourceSegment}`)
  } else {
    const action = method === 'get' && pathSegments[pathSegments.length - 1].startsWith(':') ? 'get' : method
    return camelCase(`${action} ${pathSegments.join(' ')}`)
  }
}

function generateAction(serviceName: string, route: string, method: string, functionName: string) {
  const args = ['api-action', 'new', '--serviceName', serviceName, '--route', route, '--method', method, '--functionName', functionName]

  try {
    execSync(`npx hygen ${args.join(' ')}`, {
      cwd: rootDir,
      stdio: 'inherit',
    })
  } catch (error: any) {
    throw new Error(`Failed to generate action: ${error.message}`)
  }
}

function updateRoutesFile(serviceName: string, route: string, method: string, functionName: string) {
  const routesPath = join(rootDir, 'apps', serviceName, 'src', 'routes.ts')
  const content = readFileSync(routesPath, 'utf-8')

  // Generate import and registration
  const actionPath = OpenAPIParser.routeToActionPath(method, route)
  const importPath = `./actions/${actionPath.replace('.action.ts', '.action')}`
  const handlerName = `${functionName}Handler`

  // Parse existing imports and registrations
  const lines = content.split('\n')
  const importLines: string[] = []
  const otherLines: string[] = []
  let inImports = true

  for (const line of lines) {
    if (line.startsWith('import ')) {
      importLines.push(line)
    } else {
      if (inImports && line.trim() === '') {
        inImports = false
      }
      otherLines.push(line)
    }
  }

  // Add new import (sorted alphabetically)
  const newImport = `import { ${handlerName} } from '${importPath}'`
  importLines.push(newImport)
  importLines.sort()

  // Add new route registration
  const newRegistration = `  fastify.${method}('${route}', ${handlerName})`

  // Find where to insert the registration (before the closing brace)
  const registerFunctionIndex = otherLines.findIndex((line) => line.includes('export function registerRoutes'))

  if (registerFunctionIndex === -1) {
    throw new Error('Could not find registerRoutes function in routes.ts')
  }

  // Find the last route registration before the closing brace
  let lastRegistrationIndex = -1
  for (let i = registerFunctionIndex; i < otherLines.length; i++) {
    if (otherLines[i].includes('fastify.')) {
      lastRegistrationIndex = i
    }
  }

  // Insert the new registration after the last one
  if (lastRegistrationIndex !== -1) {
    otherLines.splice(lastRegistrationIndex + 1, 0, newRegistration)
  } else {
    // No registrations yet, insert after health check
    const healthCheckIndex = otherLines.findIndex((line) => line.includes('/health'))
    if (healthCheckIndex !== -1) {
      otherLines.splice(healthCheckIndex + 1, 0, '', newRegistration)
    }
  }

  // Reconstruct the file
  const newContent = [...importLines, '', ...otherLines].join('\n')

  writeFileSync(routesPath, newContent, 'utf-8')
}

program.parse()
