#!/usr/bin/env bun

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, readdirSync, statSync } from 'fs';
import { Command } from 'commander';
import { TaskExecutor } from './executor';
import { CIReporter } from './reporters/ci-reporter';
import { CLIReporter } from './reporters/cli-reporter';
import { createBackendTasks, BACKEND_TASK_NAMES } from './configs/backend-tasks';
import { createFrontendTasks, FRONTEND_TASK_NAMES } from './configs/frontend-tasks';
import { createOpenAPITasks, OPENAPI_TASK_NAMES } from './configs/openapi-tasks';
import type { UnifiedTask } from './types';

// Get root directory
const scriptDir = resolve(dirname(fileURLToPath(import.meta.url)));
const rootDir = resolve(scriptDir, '..', '..');

const program = new Command();

program
  .name('lint')
  .description('Unified linting tool for all services')
  .version('1.0.0');

/**
 * Discovers services in the apps directory with the given prefix.
 */
function discoverServices(prefix: string): string[] {
  const appsDir = resolve(rootDir, 'apps');
  const services: string[] = [];

  try {
    const entries = readdirSync(appsDir);

    for (const entry of entries) {
      if (entry.startsWith(prefix)) {
        const fullPath = resolve(appsDir, entry);
        if (statSync(fullPath).isDirectory()) {
          services.push(entry);
        }
      }
    }
  } catch {
    // Directory might not exist
  }

  return services.sort();
}

/**
 * Builds a list of unified tasks based on CLI options.
 */
function buildUnifiedTasks(options: {
  lintBackends: boolean;
  lintFrontends: boolean;
  lintOpenAPI: boolean;
  specificBackends?: string[];
  specificFrontends?: string[];
}): UnifiedTask[] {
  const tasks: UnifiedTask[] = [];

  // Build backend tasks
  if (options.lintBackends) {
    const allBackends = discoverServices('backend-');
    const backends = options.specificBackends && options.specificBackends.length > 0
      ? allBackends.filter(s => options.specificBackends!.includes(s))
      : allBackends;

    // Validate requested backends exist
    if (options.specificBackends && options.specificBackends.length > 0) {
      const invalidBackends = options.specificBackends.filter(s => !allBackends.includes(s));
      if (invalidBackends.length > 0) {
        console.error(`Error: Invalid backend service(s): ${invalidBackends.join(', ')}`);
        console.error(`Available backends: ${allBackends.join(', ')}`);
        process.exit(1);
      }
    }

    for (const service of backends) {
      tasks.push({
        id: service,
        name: service,
        type: 'backend',
        subtasks: createBackendTasks(service, rootDir),
      });
    }
  }

  // Build frontend tasks
  if (options.lintFrontends) {
    const allFrontends = discoverServices('ui-');
    const frontends = options.specificFrontends && options.specificFrontends.length > 0
      ? allFrontends.filter(s => options.specificFrontends!.includes(s))
      : allFrontends;

    // Validate requested frontends exist
    if (options.specificFrontends && options.specificFrontends.length > 0) {
      const invalidFrontends = options.specificFrontends.filter(s => !allFrontends.includes(s));
      if (invalidFrontends.length > 0) {
        console.error(`Error: Invalid frontend service(s): ${invalidFrontends.join(', ')}`);
        console.error(`Available frontends: ${allFrontends.join(', ')}`);
        process.exit(1);
      }
    }

    for (const service of frontends) {
      tasks.push({
        id: service,
        name: service,
        type: 'frontend',
        subtasks: createFrontendTasks(service, rootDir),
      });
    }
  }

  // Build OpenAPI task
  if (options.lintOpenAPI) {
    tasks.push({
      id: 'openapi',
      name: 'openapi',
      type: 'openapi',
      subtasks: createOpenAPITasks(rootDir),
    });
  }

  return tasks;
}

// List command - lists all available services
program
  .command('list')
  .description('List all available services')
  .option('--backends', 'List only backend services')
  .option('--frontends', 'List only frontend services')
  .action((options) => {
    const configPath = resolve(rootDir, 'config/config.json');
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));

    const backendKeys = Object.keys(config.services || {}).filter(k => k.startsWith('BACKEND_'));
    const frontendKeys = Object.keys(config.uis || {}).filter(k => k.startsWith('UI_'));

    if (!options.backends && !options.frontends) {
      // Show all
      console.log('Available services:\n');

      if (backendKeys.length > 0) {
        console.log('Backend services:');
        backendKeys.forEach(key => {
          const name = key.replace('BACKEND_', 'backend-').toLowerCase();
          console.log(`  - ${name}`);
        });
        console.log('');
      }

      if (frontendKeys.length > 0) {
        console.log('Frontend services:');
        frontendKeys.forEach(key => {
          const name = key.replace('UI_', 'ui-').toLowerCase();
          console.log(`  - ${name}`);
        });
        console.log('');
      }
    } else if (options.backends) {
      console.log('Backend services:');
      backendKeys.forEach(key => {
        const name = key.replace('BACKEND_', 'backend-').toLowerCase();
        console.log(`  - ${name}`);
      });
    } else if (options.frontends) {
      console.log('Frontend services:');
      frontendKeys.forEach(key => {
        const name = key.replace('UI_', 'ui-').toLowerCase();
        console.log(`  - ${name}`);
      });
    }
  });

// Lint command - lint services with optional filtering
program
  .command('lint')
  .description('Lint services (all by default)')
  .option('--ci', 'Use CI mode (streaming output)')
  .option('--concurrency <number>', 'Max concurrent services to lint', '5')
  .option('--backends [services...]', 'Lint only specified backend services (or all if no services specified)')
  .option('--frontends [services...]', 'Lint only specified frontend services (or all if no services specified)')
  .option('--skip-openapi', 'Skip OpenAPI validation')
  .action(async (options) => {
    const isCIMode = options.ci || false;
    const skipOpenAPI = options.skipOpenapi || false;

    // Determine what to lint
    const lintBackends = !options.frontends; // Lint backends unless only frontends specified
    const lintFrontends = !options.backends; // Lint frontends unless only backends specified
    const lintOpenAPI = !skipOpenAPI && !options.frontends; // OpenAPI only with backends
    const specificBackends = Array.isArray(options.backends) ? options.backends : undefined;
    const specificFrontends = Array.isArray(options.frontends) ? options.frontends : undefined;

    // Build unified task list
    const unifiedTasks = buildUnifiedTasks({
      lintBackends,
      lintFrontends,
      lintOpenAPI,
      specificBackends,
      specificFrontends,
    });

    if (unifiedTasks.length === 0) {
      console.log('No services to lint.');
      process.exit(0);
    }

    // Combine all task names for the reporter
    const allTaskNames: Record<string, string> = {
      ...BACKEND_TASK_NAMES,
      ...FRONTEND_TASK_NAMES,
      ...OPENAPI_TASK_NAMES,
    };

    // Create reporter
    const reporter = isCIMode
      ? new CIReporter(allTaskNames)
      : new CLIReporter(allTaskNames);

    // Header
    if (!isCIMode) {
      console.log('\x1b[0;34m========================================\x1b[0m');
      console.log('\x1b[0;34m  Linting Services\x1b[0m');
      console.log('\x1b[0;34m========================================\x1b[0m');
      console.log('');
    } else {
      console.log('\x1b[0;34m========================================\x1b[0m');
      console.log('\x1b[0;34m  Linting Services (CI Mode)\x1b[0m');
      console.log('\x1b[0;34m========================================\x1b[0m');
      console.log('');
    }

    // Show what we're linting
    const backendTasks = unifiedTasks.filter(t => t.type === 'backend');
    const frontendTasks = unifiedTasks.filter(t => t.type === 'frontend');
    const openapiTasks = unifiedTasks.filter(t => t.type === 'openapi');

    if (specificBackends && specificBackends.length > 0) {
      console.log(`\x1b[0;36mLinting specific backend(s): ${specificBackends.join(', ')}\x1b[0m`);
    } else if (backendTasks.length > 0) {
      console.log(`\x1b[0;36mDiscovered ${backendTasks.length} backend service(s)\x1b[0m`);
    }

    if (specificFrontends && specificFrontends.length > 0) {
      console.log(`\x1b[0;36mLinting specific frontend(s): ${specificFrontends.join(', ')}\x1b[0m`);
    } else if (frontendTasks.length > 0) {
      console.log(`\x1b[0;36mDiscovered ${frontendTasks.length} frontend service(s)\x1b[0m`);
    }

    if (openapiTasks.length > 0) {
      console.log(`\x1b[0;36mOpenAPI validation enabled\x1b[0m`);
    }

    console.log('');

    // Parse concurrency option
    const maxConcurrency = parseInt(options.concurrency, 10);

    // Create executor and run all tasks
    const executor = new TaskExecutor(rootDir, reporter, { maxConcurrency });
    const allPassed = await executor.execute(unifiedTasks);

    // Exit with appropriate code
    if (allPassed) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  });

// Default command (no subcommand) - runs lint
program
  .action(() => {
    program.parse(['node', 'lint', 'lint', ...process.argv.slice(2)]);
  });

program.parse();
