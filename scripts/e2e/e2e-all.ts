#!/usr/bin/env bun

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readdirSync, statSync, existsSync } from 'fs';
import { Command } from 'commander';
import { E2EExecutor } from './executor';
import { CLIReporter } from './reporters/cli-reporter';
import type { E2EProject, E2ETask, TaskResult } from './types';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Get root directory
const scriptDir = resolve(dirname(fileURLToPath(import.meta.url)));
const rootDir = resolve(scriptDir, '..', '..');

const program = new Command();

program
  .name('test:e2e')
  .description('E2E testing tool for all test projects')
  .version('1.0.0');

/**
 * Discovers e2e test projects in tests/e2e directory.
 */
function discoverE2EProjects(): string[] {
  const e2eDir = resolve(rootDir, 'tests/e2e');
  const projects: string[] = [];

  try {
    const entries = readdirSync(e2eDir);

    for (const entry of entries) {
      if (entry.endsWith('-e2e')) {
        const fullPath = resolve(e2eDir, entry);
        const packageJsonPath = resolve(fullPath, 'package.json');

        if (statSync(fullPath).isDirectory() && existsSync(packageJsonPath)) {
          projects.push(entry);
        }
      }
    }
  } catch {
    // Directory might not exist
  }

  return projects.sort();
}

/**
 * Creates test tasks for an e2e project.
 */
function createE2EProjectTasks(
  projectName: string,
  rootDir: string,
  mode: 'local' | 'deployed'
): E2ETask[] {
  const projectPath = resolve(rootDir, 'tests/e2e', projectName);
  const testCommand = mode === 'deployed' ? 'test:deployed' : 'test';

  return [
    {
      id: `run-${mode}`,
      name: `Run ${mode} tests`,
      command: async (): Promise<TaskResult> => {
        const startTime = Date.now();

        try {
          // Clean up any previous containers
          try {
            await execAsync(`cd "${projectPath}" && bun run test:down`, {
              timeout: 30000,
            });
          } catch {
            // Ignore cleanup errors
          }

          // Run the test
          const { stdout, stderr } = await execAsync(`cd "${projectPath}" && bun run ${testCommand}`, {
            timeout: 300000, // 5 minute timeout
          });

          const duration = Date.now() - startTime;

          return {
            success: true,
            output: stdout,
            duration,
          };
        } catch (error: any) {
          const duration = Date.now() - startTime;

          return {
            success: false,
            output: error.stdout || '',
            error: error.stderr || error.message,
            duration,
          };
        } finally {
          // Always cleanup after test
          try {
            await execAsync(`cd "${projectPath}" && bun run test:down`, {
              timeout: 30000,
            });
          } catch {
            // Ignore cleanup errors
          }
        }
      },
    },
  ];
}

/**
 * Builds a list of e2e projects based on CLI options.
 */
function buildE2EProjects(options: {
  specificProjects?: string[];
  mode: 'local' | 'deployed';
}): E2EProject[] {
  const allProjects = discoverE2EProjects();
  const projects = options.specificProjects && options.specificProjects.length > 0
    ? allProjects.filter(p => options.specificProjects!.includes(p))
    : allProjects;

  // Validate requested projects exist
  if (options.specificProjects && options.specificProjects.length > 0) {
    const invalidProjects = options.specificProjects.filter(p => !allProjects.includes(p));
    if (invalidProjects.length > 0) {
      console.error(`Error: Invalid e2e project(s): ${invalidProjects.join(', ')}`);
      console.error(`Available projects: ${allProjects.join(', ')}`);
      process.exit(1);
    }
  }

  return projects.map(project => ({
    id: project,
    name: project,
    path: resolve(rootDir, 'tests/e2e', project),
    tasks: createE2EProjectTasks(project, rootDir, options.mode),
  }));
}

// List command - lists all available e2e projects
program
  .command('list')
  .description('List all available e2e test projects')
  .action(() => {
    const projects = discoverE2EProjects();

    console.log('Available E2E test projects:\n');

    if (projects.length > 0) {
      projects.forEach(project => {
        console.log(`  - ${project}`);
      });
      console.log('');
      console.log(`Total: ${projects.length} projects`);
    } else {
      console.log('  No e2e test projects found');
    }
  });

// Test command - run e2e tests
program
  .command('test')
  .description('Run e2e tests (all by default)')
  .option('--concurrency <number>', 'Max concurrent projects to test', '3')
  .option('--projects [projects...]', 'Run only specified projects')
  .option('--deployed', 'Run tests against deployed services (default: local)')
  .action(async (options) => {
    const mode = options.deployed ? 'deployed' : 'local';
    const specificProjects = Array.isArray(options.projects) ? options.projects : undefined;

    // Build project list
    const projects = buildE2EProjects({
      specificProjects,
      mode,
    });

    if (projects.length === 0) {
      console.log('No e2e test projects to run.');
      process.exit(0);
    }

    // Task names for display
    const taskNames: Record<string, string> = {
      'run-local': 'Run local tests',
      'run-deployed': 'Run deployed tests',
    };

    // Create reporter
    const reporter = new CLIReporter(taskNames);

    // Header
    console.log('\x1b[0;34m========================================\x1b[0m');
    console.log('\x1b[0;34m  Running E2E Tests\x1b[0m');
    console.log('\x1b[0;34m========================================\x1b[0m');
    console.log('');

    // Show what we're testing
    if (specificProjects && specificProjects.length > 0) {
      console.log(`\x1b[0;36mTesting specific project(s): ${specificProjects.join(', ')}\x1b[0m`);
    } else {
      console.log(`\x1b[0;36mDiscovered ${projects.length} e2e test project(s)\x1b[0m`);
    }

    console.log(`\x1b[0;36mMode: ${mode}\x1b[0m`);
    console.log('');

    // Parse concurrency option
    const maxConcurrency = parseInt(options.concurrency, 10);

    // Create executor and run all projects
    const executor = new E2EExecutor(rootDir, reporter, { maxConcurrency });
    const allPassed = await executor.execute(projects);

    // Exit with appropriate code
    if (allPassed) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  });

// Default command - runs test
program
  .action(() => {
    program.parse(['node', 'test:e2e', 'test', ...process.argv.slice(2)]);
  });

program.parse();
