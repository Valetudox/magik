#!/usr/bin/env node

import { spawn } from 'child_process'
import { program } from 'commander'

program
  .name('generate')
  .description('Code generation CLI using Hygen')
  .version('1.0.0')

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

function runHygen(args) {
  const hygen = spawn('npx', ['hygen', ...args], {
    stdio: 'inherit',
    shell: true
  })

  hygen.on('error', (error) => {
    console.error('Error running hygen:', error)
    process.exit(1)
  })

  hygen.on('close', (code) => {
    process.exit(code || 0)
  })
}

program.parse()
