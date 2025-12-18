#!/usr/bin/env bun

import { resolve } from 'path'
import { readdirSync, statSync, existsSync } from 'fs'
import { Command } from 'commander'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Get root directory
const rootDir = resolve(import.meta.dir, '..')

interface BuildResult {
  project: string
  success: boolean
  output: string
  error?: string
  duration: number
}

type ProjectType = 'frontend' | 'backend' | 'all'

/**
 * Discovers buildable projects in apps directory.
 */
function discoverProjects(type: ProjectType = 'all'): string[] {
  const appsDir = resolve(rootDir, 'apps')
  const projects: string[] = []

  try {
    const entries = readdirSync(appsDir)

    for (const entry of entries) {
      const fullPath = resolve(appsDir, entry)
      const packageJsonPath = resolve(fullPath, 'package.json')

      if (statSync(fullPath).isDirectory() && existsSync(packageJsonPath)) {
        // Check if package.json has a build script
        const packageJson = require(packageJsonPath)
        if (packageJson.scripts?.build) {
          // Filter by type
          if (type === 'all') {
            projects.push(entry)
          } else if (type === 'frontend' && entry.startsWith('ui-')) {
            projects.push(entry)
          } else if (type === 'backend' && entry.startsWith('backend-')) {
            projects.push(entry)
          }
        }
      }
    }
  } catch {
    // Directory might not exist
  }

  return projects.sort()
}

/**
 * Runs build for a single project.
 */
async function buildProject(projectName: string): Promise<BuildResult> {
  const projectPath = resolve(rootDir, 'apps', projectName)
  const startTime = Date.now()

  console.log(`\n[${projectName}] Starting build...`)

  try {
    const { stdout, stderr } = await execAsync(
      `cd "${projectPath}" && bun run build`,
      {
        timeout: 300000, // 5 minute timeout
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      }
    )

    const duration = Date.now() - startTime

    // Only show last few lines of output for successful builds
    const lines = stdout.trim().split('\n')
    const lastLines = lines.slice(-5).join('\n')
    console.log(`[${projectName}] ${lastLines}`)

    if (stderr && !stderr.includes('warning')) {
      console.error(`[${projectName}] ${stderr}`)
    }

    console.log(`[${projectName}] ✅ Built (${(duration / 1000).toFixed(2)}s)`)

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
  }
}

/**
 * Runs builds for multiple projects with concurrency control.
 */
async function buildProjects(
  projects: string[],
  concurrency: number
): Promise<BuildResult[]> {
  const results: BuildResult[] = []
  const queue = [...projects]

  // Run projects with controlled concurrency
  const running: Promise<void>[] = []

  while (queue.length > 0 || running.length > 0) {
    // Start new builds up to concurrency limit
    while (running.length < concurrency && queue.length > 0) {
      const project = queue.shift()!
      const promise = buildProject(project).then((result) => {
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
 * Prints summary of build results.
 */
function printSummary(results: BuildResult[]): void {
  console.log('\n========================================')
  console.log('  Build Summary')
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
    console.log('\n❌ Some builds failed')
  } else {
    console.log('\n✅ All builds passed!')
  }
}

// CLI Setup
const program = new Command()

program
  .name('build')
  .description('Build tool for monorepo projects')
  .version('1.0.0')

// List command
program
  .command('list')
  .description('List all buildable projects')
  .option('--frontend', 'List only frontend projects (ui-*)')
  .option('--backend', 'List only backend projects (backend-*)')
  .action((options) => {
    const type: ProjectType = options.frontend ? 'frontend' : options.backend ? 'backend' : 'all'
    const projects = discoverProjects(type)

    console.log(`Buildable projects (${type}):\n`)

    if (projects.length > 0) {
      projects.forEach((project) => {
        console.log(`  - ${project}`)
      })
      console.log('')
      console.log(`Total: ${projects.length} projects`)
    } else {
      console.log('  No buildable projects found')
    }
  })

// Build command
program
  .command('build')
  .description('Build projects (all by default)')
  .option('--concurrency <number>', 'Max concurrent builds', '2')
  .option('--projects <projects...>', 'Build only specified projects')
  .option('--frontend', 'Build only frontend projects (ui-*)')
  .option('--backend', 'Build only backend projects (backend-*)')
  .action(async (options) => {
    const type: ProjectType = options.frontend ? 'frontend' : options.backend ? 'backend' : 'all'
    const allProjects = discoverProjects(type)
    const requestedProjects = options.projects

    // Determine which projects to build
    let projects: string[]
    if (requestedProjects && requestedProjects.length > 0) {
      // Validate requested projects exist
      const invalidProjects = requestedProjects.filter(
        (p: string) => !allProjects.includes(p)
      )
      if (invalidProjects.length > 0) {
        console.error(`Error: Invalid project(s): ${invalidProjects.join(', ')}`)
        console.error(`Available projects: ${allProjects.join(', ')}`)
        process.exit(1)
      }
      projects = requestedProjects
    } else {
      projects = allProjects
    }

    if (projects.length === 0) {
      console.log('No projects to build.')
      process.exit(0)
    }

    console.log('========================================')
    console.log('  Building Projects')
    console.log('========================================')
    console.log('')

    if (requestedProjects && requestedProjects.length > 0) {
      console.log(`Building specific project(s): ${projects.join(', ')}`)
    } else {
      console.log(`Discovered ${projects.length} buildable project(s)`)
    }

    console.log(`Concurrency: ${options.concurrency}`)

    const concurrency = parseInt(options.concurrency, 10)
    const results = await buildProjects(projects, concurrency)

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
