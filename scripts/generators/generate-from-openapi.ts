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
  .name('generate-from-openapi')
  .description('Generate backend service, client, and E2E tests from OpenAPI specification')
  .version('1.0.0')

program
  .command('generate')
  .description('Generate a new backend service from OpenAPI spec')
  .requiredOption('-s, --service <name>', 'Service name (must exist in config.json, e.g., backend-weather)')
  .action(async (options) => {
    try {
      console.log('🚀 Starting OpenAPI-first code generation...\n')

      const serviceName = options.service

      // Step 0: Read config.json
      console.log('📖 Step 0: Reading config.json...')
      const config = readConfig(serviceName)
      console.log(`✅ Found config for ${serviceName}\n`)

      // Extract domain name (remove backend- or backend_ prefix)
      const domain = serviceName.replace(/^backend[-_]/, '')
      const openapiPath = resolve(rootDir, 'specs', 'domains', domain, 'openapi.yaml')
      const devPort = config.dev
      const prodPort = config.prod
      const apiRoute = config.apiRoute
      const backendMode = config.backendMode
      const dataFolders = config.dataFolders || []

      // Step 1: Validate
      console.log('📋 Step 1: Validating...')
      validateInputs(serviceName, openapiPath)
      console.log('✅ Validation passed\n')

      // Step 2: Parse OpenAPI
      console.log('📖 Step 2: Parsing OpenAPI spec...')
      const parser = new OpenAPIParser(openapiPath)
      const parsed = parser.parse()
      console.log(`✅ Parsed ${parsed.operations.length} operations\n`)

      // Step 3: Generate backend service
      console.log('🏗️  Step 3: Generating backend service structure...')
      const description = parsed.info.description || `${domain} service`
      await generateBackendService(domain, prodPort, description, dataFolders)
      console.log('✅ Backend service structure created\n')

      // Step 4: Generate actions for each operation
      console.log('⚡ Step 4: Generating action files...')
      await generateActions(domain, parsed.operations)
      console.log(`✅ Generated ${parsed.operations.length} action files\n`)

      // Step 5: Generate Zod schemas using @hey-api/openapi-ts
      console.log('📝 Step 5: Generating Zod schemas from OpenAPI...')
      await generateSchemas(serviceName, openapiPath)
      console.log('✅ Zod schemas generated\n')

      // Step 6: Update routes.ts
      console.log('🔗 Step 6: Updating routes.ts with all operations...')
      await updateRoutes(serviceName, parsed.operations)
      console.log('✅ Routes registered\n')

      // Step 7: Generate client package
      console.log('📦 Step 7: Generating client package...')
      const relativeOpenapiPath = `specs/domains/${domain}/openapi.yaml`
      await generateClient(domain, relativeOpenapiPath)
      console.log('✅ Client package generated\n')

      // Step 8: Generate E2E tests
      console.log('🧪 Step 8: Generating E2E tests...')
      await generateE2ETests(domain, serviceName, prodPort, relativeOpenapiPath)
      console.log('✅ E2E tests generated\n')

      // Step 9: Run linters
      console.log('🔍 Step 9: Running linters...')
      await runLinters(serviceName)
      console.log('✅ All linters passed\n')

      console.log('✨ Generation complete!\n')
      console.log(`📁 Service: apps/${serviceName}`)
      console.log(`📦 Client: packages/backend-${domain}-client`)
      console.log(`🧪 E2E Tests: tests/e2e/backend-${domain}-e2e\n`)
      console.log(`⚙️  Config: config.json already has ${serviceName} entry\n`)
    } catch (error) {
      console.error('❌ Generation failed:', (error as Error).message)
      process.exit(1)
    }
  })

function readConfig(serviceName: string) {
  const configPath = join(rootDir, 'config', 'config.json')
  if (!existsSync(configPath)) {
    throw new Error(`config.json not found at ${configPath}`)
  }

  const config = JSON.parse(readFileSync(configPath, 'utf-8'))
  const serviceKey = serviceName.toUpperCase().replace(/-/g, '_')

  if (!config.services || !config.services[serviceKey]) {
    throw new Error(
      `Service ${serviceName} (${serviceKey}) not found in config.json.\n` +
        `Please add an entry to config/config.json first:\n\n` +
        `"${serviceKey}": {\n` +
        `  "dev": 4000,\n` +
        `  "prod": 3000,\n` +
        `  "apiRoute": "/api/${serviceName.replace(/^backend[-_]/, '')}",\n` +
        `  "containerName": "${serviceName}",\n` +
        `  "backendMode": "endpoint-only",\n` +
        `  "dataFolders": []\n` +
        `}`
    )
  }

  return config.services[serviceKey]
}

function validateInputs(serviceName: string, openapiPath: string) {
  // Check service doesn't exist
  const servicePath = join(rootDir, 'apps', serviceName)
  if (existsSync(servicePath)) {
    throw new Error(`Service ${serviceName} already exists at ${servicePath}`)
  }

  // Check OpenAPI spec exists
  if (!existsSync(openapiPath)) {
    throw new Error(`OpenAPI spec not found: ${openapiPath}\n` + `Expected location: specs/domains/${serviceName.replace(/^backend[-_]/, '')}/openapi.yaml`)
  }

  // TODO: Run Spectral validation on OpenAPI spec
}

async function generateBackendService(
  domain: string,
  port: number,
  description: string,
  dataFolders: string[]
) {
  const args = [
    'backend-service',
    'new',
    '--serviceName',
    domain,
    '--port',
    port.toString(),
    '--description',
    description,
  ]

  if (dataFolders.length > 0) {
    args.push('--dataFolders', dataFolders.join(','))
  }

  runHygen(args)
}

async function generateActions(domain: string, operations: any[]) {
  for (const operation of operations) {
    const route = OpenAPIParser.openapiPathToFastifyPath(operation.path)
    const functionName = operation.operationId || camelCase(`${operation.method} ${operation.path}`)

    const args = [
      'api-action',
      'new',
      '--serviceName',
      domain,
      '--route',
      route,
      '--method',
      operation.method,
      '--functionName',
      functionName,
    ]

    runHygen(args)
  }
}

async function generateSchemas(serviceName: string, openapiPath: string) {
  const outputDir = join(rootDir, 'apps', serviceName, 'src', 'generated')

  // Only generate types and Zod schemas, NOT the client SDK
  // By not specifying --client, no client code is generated
  console.log('  Running @hey-api/openapi-ts with Zod plugin...')
  execSync(
    `npx @hey-api/openapi-ts -i ${openapiPath} -o ${outputDir} --plugins @hey-api/typescript --plugins zod`,
    {
      cwd: rootDir,
      stdio: 'inherit',
    }
  )
}

async function updateRoutes(serviceName: string, operations: any[]) {
  const routesPath = join(rootDir, 'apps', serviceName, 'src', 'routes.ts')

  const imports = [
    "import type { FastifyInstance } from 'fastify'",
    "import type { ZodTypeProvider } from 'fastify-type-provider-zod'",
  ]

  const actionImports: Array<{ path: string; statement: string }> = []
  const schemaImports = new Set<string>()
  const registrations: string[] = []

  for (const operation of operations) {
    const actionPath = OpenAPIParser.routeToActionPath(operation.method, operation.path)
    const importPath = `./actions/${actionPath.replace('.action.ts', '.action.js')}`
    const handlerName = operation.operationId
    const fastifyPath = OpenAPIParser.openapiPathToFastifyPath(operation.path)

    // Import action handler
    actionImports.push({
      path: importPath,
      statement: `import { ${handlerName} } from '${importPath}'`,
    })

    // Import Data and Response schemas from generated zod.gen.ts
    // Schema naming: z{OperationId}Data and z{OperationId}Response
    const dataSchema = `z${operation.operationId.charAt(0).toUpperCase() + operation.operationId.slice(1)}Data`
    const responseSchema = `z${operation.operationId.charAt(0).toUpperCase() + operation.operationId.slice(1)}Response`

    schemaImports.add(dataSchema)
    schemaImports.add(responseSchema)

    // Build Fastify schema object - extract body, params, query from Data schema
    // and use Response schema for 200 response
    const schemaLines = []
    schemaLines.push(`schema: {`)
    schemaLines.push(`      body: ${dataSchema}.shape.body,`)
    schemaLines.push(`      params: ${dataSchema}.shape.path,`)
    schemaLines.push(`      querystring: ${dataSchema}.shape.query,`)
    schemaLines.push(`      response: {`)
    schemaLines.push(`        200: ${responseSchema}`)
    schemaLines.push(`      }`)
    schemaLines.push(`    }`)

    // Register route with schema validation
    registrations.push(`
  typedFastify.${operation.method}('${fastifyPath}', {
    ${schemaLines.join('\n    ')}
  }, ${handlerName})`)
  }

  // Sort action imports by import path
  actionImports.sort((a, b) => a.path.localeCompare(b.path))

  const content = `${imports.join('\n')}
${actionImports.map(i => i.statement).join('\n')}
import { ${Array.from(schemaImports).sort().join(', ')} } from './generated/zod.gen.js'

export function registerRoutes(fastify: FastifyInstance) {
  const typedFastify = fastify.withTypeProvider<ZodTypeProvider>()

  typedFastify.get('/health', () => ({ status: 'ok' }))
${registrations.join('\n')}
}
`

  writeFileSync(routesPath, content, 'utf-8')
}

async function generateClient(domain: string, openapiPath: string) {
  const args = ['backend-client', 'new', '--domain', domain, '--openapiPath', openapiPath]

  runHygen(args)

  // Run @hey-api/openapi-ts
  const clientDir = join(rootDir, 'packages', `backend-${domain}-client`)
  console.log('  Running @hey-api/openapi-ts...')
  execSync('bun run generate', { cwd: clientDir, stdio: 'inherit' })
}

async function generateE2ETests(domain: string, serviceName: string, port: number, openapiPath: string) {
  const args = [
    'e2e-tests',
    'new',
    '--domain',
    domain,
    '--serviceName',
    serviceName,
    '--port',
    port.toString(),
    '--openapiPath',
    openapiPath,
  ]

  runHygen(args)
}

async function runLinters(serviceName: string) {
  try {
    // Install dependencies first
    console.log('  Installing dependencies...')
    execSync('bun install', {
      cwd: rootDir,
      stdio: 'pipe',
    })

    execSync(`bun run lint --backends ${serviceName}`, {
      cwd: rootDir,
      stdio: 'pipe',
    })
  } catch (error: any) {
    throw new Error(`Linting failed: ${error.message}`)
  }
}

function runHygen(args: string[]) {
  try {
    execSync(`npx hygen ${args.join(' ')}`, {
      cwd: rootDir,
      stdio: 'inherit',
    })
  } catch (error: any) {
    throw new Error(`Hygen failed: ${error.message}`)
  }
}

program.parse()
