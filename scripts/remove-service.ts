#!/usr/bin/env bun

import { Command } from 'commander'
import { resolve } from 'path'
import { existsSync, rmSync, readFileSync, writeFileSync } from 'fs'

const rootDir = resolve(import.meta.dir, '..')
const configPath = resolve(rootDir, 'config/config.json')

interface Config {
  packages: Record<string, unknown>
  menu: Array<{ title: string; icon: string; items: Array<{ ui: string; icon: string }> }>
  services: Record<string, unknown>
  uis: Record<string, unknown>
}

function loadConfig(): Config {
  return JSON.parse(readFileSync(configPath, 'utf-8')) as Config
}

function discoverServices(): string[] {
  const config = loadConfig()
  const serviceNames = new Set<string>()

  for (const key of Object.keys(config.services)) {
    if (key.startsWith('BACKEND_')) {
      const name = key.replace('BACKEND_', '').toLowerCase()
      serviceNames.add(name)
    }
  }

  return [...serviceNames].sort()
}

function findRelatedPaths(serviceName: string): string[] {
  const patterns = [
    // Apps
    `apps/backend-${serviceName}`,
    `apps/ui-${serviceName}`,

    // Packages (try plural and singular)
    `packages/${serviceName}`,
    `packages/${serviceName}s`,
    `packages/backend-${serviceName}-client`,
    `packages/agents/src/agents/${serviceName}`,

    // Specs
    `specs/domains/${serviceName}`,

    // Skills (try plural and singular)
    `skills/${serviceName}`,
    `skills/${serviceName}s`,

    // Tests
    `tests/e2e/backend-${serviceName}-e2e`,
    `tests/e2e/ui-${serviceName}-e2e`,
  ]

  return patterns.filter((p) => existsSync(resolve(rootDir, p)))
}

function updateConfigJson(serviceName: string, dryRun: boolean): string[] {
  const config = loadConfig()
  const changes: string[] = []
  const upperName = serviceName.toUpperCase()

  // Remove from menu items
  for (const group of config.menu) {
    const before = group.items.length
    group.items = group.items.filter((item) => item.ui !== `UI_${upperName}`)
    if (group.items.length < before) {
      changes.push(`config.json: Remove UI_${upperName} from menu`)
    }
  }

  // Remove empty menu groups
  config.menu = config.menu.filter((group) => group.items.length > 0)

  // Remove from services
  if (config.services[`BACKEND_${upperName}`]) {
    delete config.services[`BACKEND_${upperName}`]
    changes.push(`config.json: Remove BACKEND_${upperName} from services`)
  }

  // Remove from uis
  if (config.uis[`UI_${upperName}`]) {
    delete config.uis[`UI_${upperName}`]
    changes.push(`config.json: Remove UI_${upperName} from uis`)
  }

  if (!dryRun && changes.length > 0) {
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n')
  }

  return changes
}

function updateAgentsPackageJson(serviceName: string, dryRun: boolean): string[] {
  const pkgPath = resolve(rootDir, 'packages/agents/package.json')
  if (!existsSync(pkgPath)) return []

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as {
    dependencies?: Record<string, string>
  }
  const changes: string[] = []

  if (pkg.dependencies) {
    const depsToRemove = Object.keys(pkg.dependencies).filter(
      (dep) =>
        dep === `@magik/${serviceName}` ||
        dep === `@magik/${serviceName}s` ||
        dep.includes(serviceName)
    )

    for (const dep of depsToRemove) {
      delete pkg.dependencies[dep]
      changes.push(`packages/agents/package.json: Remove dependency ${dep}`)
    }
  }

  if (!dryRun && changes.length > 0) {
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
  }

  return changes
}

function updateAgentsIndexTs(serviceName: string, dryRun: boolean): string[] {
  const indexPath = resolve(rootDir, 'packages/agents/src/index.ts')
  if (!existsSync(indexPath)) return []

  const content = readFileSync(indexPath, 'utf-8')
  const lines = content.split('\n')
  const changes: string[] = []

  const filteredLines = lines.filter((line) => {
    const lowerLine = line.toLowerCase()
    if (lowerLine.includes(serviceName) && (lowerLine.includes('export') || lowerLine.includes('import'))) {
      changes.push(`packages/agents/src/index.ts: Remove line containing "${serviceName}"`)
      return false
    }
    return true
  })

  if (!dryRun && changes.length > 0) {
    writeFileSync(indexPath, filteredLines.join('\n'))
  }

  return changes
}

function removeService(serviceName: string, dryRun: boolean): void {
  console.log(`\n${'='.repeat(50)}`)
  console.log(`  ${dryRun ? '[DRY RUN] ' : ''}Removing service: ${serviceName}`)
  console.log('='.repeat(50))

  // Find directories to remove
  const paths = findRelatedPaths(serviceName)

  if (paths.length === 0) {
    console.log(`\n  No directories found for service "${serviceName}"`)
  } else {
    console.log('\n  Directories to remove:')
    for (const p of paths) {
      console.log(`    - ${p}`)
      if (!dryRun) {
        rmSync(resolve(rootDir, p), { recursive: true, force: true })
      }
    }
  }

  // Update config files
  const configChanges = updateConfigJson(serviceName, dryRun)
  const pkgChanges = updateAgentsPackageJson(serviceName, dryRun)
  const indexChanges = updateAgentsIndexTs(serviceName, dryRun)

  const allChanges = [...configChanges, ...pkgChanges, ...indexChanges]

  if (allChanges.length > 0) {
    console.log('\n  Config updates:')
    for (const change of allChanges) {
      console.log(`    - ${change}`)
    }
  }

  console.log('')
}

// CLI
const program = new Command()

program.name('remove-service').description('Remove a service and all related code from the monorepo')

program
  .command('list')
  .description('List all available services')
  .action(() => {
    const services = discoverServices()

    console.log('\nAvailable services:\n')

    if (services.length > 0) {
      for (const service of services) {
        console.log(`  - ${service}`)
      }
      console.log('')
      console.log(`Total: ${services.length} services`)
    } else {
      console.log('  No services found')
    }
    console.log('')
  })

program
  .command('remove')
  .description('Remove service(s) and all related code')
  .argument('<services...>', 'Service name(s) to remove')
  .option('--dry-run', 'Show what would be removed without deleting')
  .action((services: string[], options: { dryRun?: boolean }) => {
    const availableServices = discoverServices()
    const dryRun = options.dryRun ?? false

    // Validate services exist
    const invalidServices = services.filter((s) => !availableServices.includes(s.toLowerCase()))
    if (invalidServices.length > 0) {
      console.error(`\nError: Unknown service(s): ${invalidServices.join(', ')}`)
      console.error(`Available services: ${availableServices.join(', ')}`)
      process.exit(1)
    }

    if (dryRun) {
      console.log('\n[DRY RUN MODE - No changes will be made]')
    }

    for (const service of services) {
      removeService(service.toLowerCase(), dryRun)
    }

    if (!dryRun) {
      console.log('Done! Run `bun install` to update the lockfile.')
    }
  })

program.parse()
