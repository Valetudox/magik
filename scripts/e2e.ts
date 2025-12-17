#!/usr/bin/env bun

import { resolve } from 'path'
import { readdirSync, statSync, existsSync } from 'fs'
import { Command } from 'commander'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Get root directory
const rootDir = resolve(import.meta.dir, '..')

interface TestResult {
  project: string
  success: boolean
  output: string
  error?: string
  duration: number
}

/**
 * Discovers e2e test projects in tests/e2e directory.
 */
function discoverProjects(): string[] {
  const e2eDir = resolve(rootDir, 'tests/e2e')
  const projects: string[] = []

  try {
    const entries = readdirSync(e2eDir)

    for (const entry of entries) {
      if (entry.endsWith('-e2e')) {
        const fullPath = resolve(e2eDir, entry)
        const packageJsonPath = resolve(fullPath, 'package.json')

        if (statSync(fullPath).isDirectory() && existsSync(packageJsonPath)) {
          projects.push(entry)
        }
      }
    }
  } catch {
    // Directory might not exist
  }

  return projects.sort()
}

/**
 * Runs e2e tests for a single project.
 */
async function runProject(
  projectName: string,
  mode: 'local' | 'deployed'
): Promise<TestResult> {
  const projectPath = resolve(rootDir, 'tests/e2e', projectName)
  const testCommand = mode === 'deployed' ? 'test:deployed' : 'test'
  const startTime = Date.now()

  console.log(`\n[${projectName}] Starting ${mode} tests...`)

  try {
    // Clean up any previous containers
    try {
      await execAsync(`cd "${projectPath}" && bun run test:down`, {
        timeout: 30000,
      })
    } catch {
      // Ignore cleanup errors
    }

    // Run the test
    const { stdout, stderr } = await execAsync(
      `cd "${projectPath}" && bun run ${testCommand}`,
      {
        timeout: 300000, // 5 minute timeout
      }
    )

    const duration = Date.now() - startTime

    console.log(`[${projectName}] ${stdout}`)
    if (stderr) {
      console.error(`[${projectName}] ${stderr}`)
    }

    console.log(`[${projectName}] ✅ Passed (${(duration / 1000).toFixed(2)}s)`)

    return {
      project: projectName,
      success: true,
      output: stdout,
      duration,
    }
  } catch (error: any) {
    const duration = Date.now() - startTime

    console.log(`[${projectName}] ${error.stdout || ''}`)
    console.error(`[${projectName}] ${error.stderr || error.message}`)
    console.error(`[${projectName}] ❌ Failed (${(duration / 1000).toFixed(2)}s)`)

    return {
      project: projectName,
      success: false,
      output: error.stdout || '',
      error: error.stderr || error.message,
      duration,
    }
  } finally {
    // Always cleanup after test
    try {
      await execAsync(`cd "${projectPath}" && bun run test:down`, {
        timeout: 30000,
      })
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Runs tests for multiple projects with concurrency control.
 */
async function runProjects(
  projects: string[],
  mode: 'local' | 'deployed',
  concurrency: number
): Promise<TestResult[]> {
  const results: TestResult[] = []
  const queue = [...projects]

  // Run projects with controlled concurrency
  const running: Promise<void>[] = []

  while (queue.length > 0 || running.length > 0) {
    // Start new tests up to concurrency limit
    while (running.length < concurrency && queue.length > 0) {
      const project = queue.shift()!
      const promise = runProject(project, mode).then((result) => {
        results.push(result)
        // Remove from running when done
        const index = running.indexOf(promise)
        if (index > -1) {
          running.splice(index, 1)
        }
      })
      running.push(promise)
    }

    // Wait for at least one to complete
    if (running.length > 0) {
      await Promise.race(running)
    }
  }

  return results
}

/**
 * Prints summary of test results.
 */
function printSummary(results: TestResult[]): void {
  console.log('\n========================================')
  console.log('  Test Summary')
  console.log('========================================\n')

  const passed = results.filter((r) => r.success)
  const failed = results.filter((r) => !r.success)

  for (const result of results) {
    const status = result.success ? '✅' : '❌'
    const time = (result.duration / 1000).toFixed(2)
    console.log(`${status} ${result.project} (${time}s)`)
  }

  console.log('')
  console.log(
    `Results: ${passed.length} passed, ${failed.length} failed out of ${results.length} project(s)`
  )

  if (failed.length > 0) {
    console.log('\n❌ Some tests failed')
  } else {
    console.log('\n✅ All tests passed!')
  }
}

// CLI Setup
const program = new Command()

program
  .name('e2e')
  .description('E2E testing tool')
  .version('1.0.0')

// List command
program
  .command('list')
  .description('List all available e2e test projects')
  .action(() => {
    const projects = discoverProjects()

    console.log('Available E2E test projects:\n')

    if (projects.length > 0) {
      projects.forEach((project) => {
        console.log(`  - ${project}`)
      })
      console.log('')
      console.log(`Total: ${projects.length} projects`)
    } else {
      console.log('  No e2e test projects found')
    }
  })

// Test command
program
  .command('test')
  .description('Run e2e tests (all by default)')
  .option('--concurrency <number>', 'Max concurrent projects to test', '3')
  .option('--projects <projects...>', 'Run only specified projects')
  .option('--deployed', 'Run tests against deployed services (default: local)')
  .action(async (options) => {
    const mode = options.deployed ? 'deployed' : 'local'
    const allProjects = discoverProjects()
    const requestedProjects = options.projects

    // Determine which projects to run
    let projects: string[]
    if (requestedProjects && requestedProjects.length > 0) {
      // Validate requested projects exist
      const invalidProjects = requestedProjects.filter(
        (p: string) => !allProjects.includes(p)
      )
      if (invalidProjects.length > 0) {
        console.error(`Error: Invalid e2e project(s): ${invalidProjects.join(', ')}`)
        console.error(`Available projects: ${allProjects.join(', ')}`)
        process.exit(1)
      }
      projects = requestedProjects
    } else {
      projects = allProjects
    }

    if (projects.length === 0) {
      console.log('No e2e test projects to run.')
      process.exit(0)
    }

    console.log('========================================')
    console.log('  Running E2E Tests')
    console.log('========================================')
    console.log('')

    if (requestedProjects && requestedProjects.length > 0) {
      console.log(`Testing specific project(s): ${projects.join(', ')}`)
    } else {
      console.log(`Discovered ${projects.length} e2e test project(s)`)
    }

    console.log(`Mode: ${mode}`)
    console.log(`Concurrency: ${options.concurrency}`)

    const concurrency = parseInt(options.concurrency, 10)
    const results = await runProjects(projects, mode, concurrency)

    printSummary(results)

    // Exit with appropriate code
    const allPassed = results.every((r) => r.success)
    process.exit(allPassed ? 0 : 1)
  })

// Default command - show help
program.action(() => {
  program.help()
})

program.parse()
