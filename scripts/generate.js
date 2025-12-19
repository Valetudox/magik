#!/usr/bin/env node

import { spawn, execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { join, dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { program } from 'commander'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')

program
  .name('generate')
  .description('Code generation CLI using Hygen')
  .version('1.0.0')

// ============================================================================
// LOW-LEVEL HYGEN WRAPPERS
// ============================================================================

program
  .command('backend-service')
  .description('Generate a new backend service')
  .option('-n, --serviceName <name>', 'Service name (kebab-case)')
  .option('-p, --port <port>', 'Port number')
  .option('-d, --description <description>', 'Service description')
  .action((options) => {
    const args = ['backend-service', 'new']

    if (options.serviceName) {
      args.push('--serviceName', options.serviceName)
    }
    if (options.port) {
      args.push('--port', options.port)
    }
    if (options.description) {
      args.push('--description', options.description)
    }

    runHygen(args)
  })

program
  .command('api-action')
  .description('Generate an API action file')
  .option('-s, --serviceName <name>', 'Backend service name')
  .option('-r, --route <route>', 'API route (e.g., /api/decisions/:id)')
  .option('-m, --method <method>', 'HTTP method (get, post, patch, delete, put)')
  .option('-f, --functionName <name>', 'Function name (camelCase)')
  .action((options) => {
    const args = ['api-action', 'new']

    if (options.serviceName) {
      args.push('--serviceName', options.serviceName)
    }
    if (options.route) {
      args.push('--route', options.route)
    }
    if (options.method) {
      args.push('--method', options.method)
    }
    if (options.functionName) {
      args.push('--functionName', options.functionName)
    }

    runHygen(args)
  })

program
  .command('e2e-tests')
  .description('Generate E2E test suite for a backend service')
  .option('-d, --domain <domain>', 'Domain name (e.g., audio)')
  .option('-s, --serviceName <name>', 'Service name (e.g., backend-audio)')
  .option('-p, --port <port>', 'Production port')
  .option('-o, --openapiPath <path>', 'OpenAPI spec path')
  .action((options) => {
    const args = ['e2e-tests', 'new']

    if (options.domain) {
      args.push('--domain', options.domain)
    }
    if (options.serviceName) {
      args.push('--serviceName', options.serviceName)
    }
    if (options.port) {
      args.push('--port', options.port)
    }
    if (options.openapiPath) {
      args.push('--openapiPath', options.openapiPath)
    }

    runHygen(args)
  })

program
  .command('backend-client')
  .description('Generate client SDK package')
  .option('-d, --domain <domain>', 'Domain name (e.g., audio)')
  .option('-o, --openapiPath <path>', 'OpenAPI spec path')
  .action((options) => {
    const args = ['backend-client', 'new']

    if (options.domain) {
      args.push('--domain', options.domain)
    }
    if (options.openapiPath) {
      args.push('--openapiPath', options.openapiPath)
    }

    runHygen(args)
  })

program
  .command('ui-service')
  .description('Generate a new UI service')
  .option('-n, --serviceName <name>', 'Service name (kebab-case)')
  .option('-b, --basePath <path>', 'Base path (e.g., /decisions)')
  .option('-p, --vitePort <port>', 'Vite dev server port')
  .option('-d, --dependsOn <deps>', 'Backend dependencies (comma-separated)')
  .action((options) => {
    const args = ['ui-service', 'new']

    if (options.serviceName) {
      args.push('--serviceName', options.serviceName)
    }
    if (options.basePath) {
      args.push('--basePath', options.basePath)
    }
    if (options.vitePort) {
      args.push('--vitePort', options.vitePort)
    }
    if (options.dependsOn) {
      args.push('--dependsOn', options.dependsOn)
    }

    runHygen(args)
  })

// ============================================================================
// HIGH-LEVEL ORCHESTRATED COMMANDS
// ============================================================================

program
  .command('from-openapi')
  .description('Generate full backend service from OpenAPI spec (9 steps)')
  .requiredOption('-s, --service <name>', 'Service name (must exist in config.json)')
  .action(async (options) => {
    try {
      execSync(`bun run scripts/generators/generate-from-openapi.ts generate --service ${options.service}`, {
        cwd: rootDir,
        stdio: 'inherit',
      })
    } catch (error) {
      console.error('Failed to run from-openapi generator')
      process.exit(1)
    }
  })

program
  .command('add-action')
  .description('Add a new action to existing backend service')
  .requiredOption('-s, --service <name>', 'Service name (e.g., backend-decision)')
  .requiredOption('-r, --route <route>', 'API route (e.g., /api/decisions/:id)')
  .requiredOption('-m, --method <method>', 'HTTP method')
  .option('-f, --functionName <name>', 'Function name (auto-derived if omitted)')
  .action(async (options) => {
    try {
      let cmd = `bun run scripts/generators/add-action.ts --service ${options.service} --route "${options.route}" --method ${options.method}`
      if (options.functionName) {
        cmd += ` --function-name ${options.functionName}`
      }
      execSync(cmd, {
        cwd: rootDir,
        stdio: 'inherit',
      })
    } catch (error) {
      console.error('Failed to add action')
      process.exit(1)
    }
  })

// ============================================================================
// E2E GENERATION COMMAND (THE MAIN NEW FEATURE)
// ============================================================================

program
  .command('e2e')
  .description('Generate E2E tests for existing backend services')
  .option('-s, --service <name>', 'Generate for specific service (e.g., backend-audio)')
  .option('--all', 'Generate for all services missing E2E tests')
  .action(async (options) => {
    try {
      const config = readConfig()
      const services = config.services

      let servicesToProcess = []

      if (options.all) {
        // Find all backend services missing E2E tests
        for (const [key, value] of Object.entries(services)) {
          const serviceName = `backend-${key.toLowerCase().replace('backend_', '')}`
          const e2ePath = join(rootDir, 'tests', 'e2e', `${serviceName}-e2e`)

          if (!existsSync(e2ePath)) {
            servicesToProcess.push({ key, serviceName, config: value })
          }
        }

        if (servicesToProcess.length === 0) {
          console.log('All services already have E2E tests.')
          return
        }

        console.log(`Found ${servicesToProcess.length} services missing E2E tests:`)
        servicesToProcess.forEach((s) => console.log(`  - ${s.serviceName}`))
        console.log('')
      } else if (options.service) {
        // Find specific service
        const serviceKey = options.service.toUpperCase().replace(/-/g, '_')
        const serviceConfig = services[serviceKey]

        if (!serviceConfig) {
          console.error(`Service ${options.service} not found in config.json`)
          console.error(`Available services: ${Object.keys(services).join(', ')}`)
          process.exit(1)
        }

        servicesToProcess.push({
          key: serviceKey,
          serviceName: options.service,
          config: serviceConfig,
        })
      } else {
        console.error('Please specify --service <name> or --all')
        process.exit(1)
      }

      // Generate E2E tests for each service
      for (const { key, serviceName, config: serviceConfig } of servicesToProcess) {
        const domain = serviceName.replace(/^backend-/, '')
        const port = serviceConfig.prod
        const openapiPath = `specs/domains/${domain}/openapi.yaml`

        // Check if OpenAPI spec exists
        const fullOpenapiPath = join(rootDir, openapiPath)
        if (!existsSync(fullOpenapiPath)) {
          console.warn(`Skipping ${serviceName}: OpenAPI spec not found at ${openapiPath}`)
          continue
        }

        // Check if e2e tests already exist
        const e2ePath = join(rootDir, 'tests', 'e2e', `${serviceName}-e2e`)
        if (existsSync(e2ePath)) {
          console.log(`Skipping ${serviceName}: E2E tests already exist at ${e2ePath}`)
          continue
        }

        console.log(`Generating E2E tests for ${serviceName}...`)
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

        runHygenSync(args)
        console.log(`E2E tests generated for ${serviceName}`)
      }

      console.log('\nE2E test generation complete!')
    } catch (error) {
      console.error('Failed to generate E2E tests:', error.message)
      process.exit(1)
    }
  })

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function readConfig() {
  const configPath = join(rootDir, 'config', 'config.json')
  if (!existsSync(configPath)) {
    throw new Error(`config.json not found at ${configPath}`)
  }
  return JSON.parse(readFileSync(configPath, 'utf-8'))
}

function runHygen(args) {
  const hygen = spawn('npx', ['hygen', ...args], {
    stdio: 'inherit',
    shell: true,
  })

  hygen.on('error', (error) => {
    console.error('Error running hygen:', error)
    process.exit(1)
  })

  hygen.on('close', (code) => {
    process.exit(code || 0)
  })
}

function runHygenSync(args) {
  try {
    execSync(`npx hygen ${args.join(' ')}`, {
      cwd: rootDir,
      stdio: 'inherit',
    })
  } catch (error) {
    throw new Error(`Hygen failed: ${error.message}`)
  }
}

program.parse()
