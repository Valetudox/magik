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
import { createPackageTasks, PACKAGE_TASK_NAMES } from './configs/package-tasks';
import type { UnifiedTask } from './types';

// Get root directory
const scriptDir = resolve(dirname(fileURLToPath(import.meta.url)));
const rootDir = resolve(scriptDir, '..', '..');

// Load config once
const configPath = resolve(rootDir, 'config/config.json');
const config = JSON.parse(readFileSync(configPath, 'utf-8'));

const program = new Command();

program
  .name('lint')
  .description('Unified linting tool for all services')
  .version('1.0.0');

/**
 * Discovers backend services from config.json.
 * Returns folder names (containerName) for each service.
 */
function discoverBackendServices(): string[] {
  const services: string[] = [];

  for (const [key, value] of Object.entries(config.services || {})) {
    if (key.startsWith('BACKEND_')) {
      const containerName = (value as { containerName: string }).containerName;
      services.push(containerName);
    }
  }

  return services.sort();
}

/**
 * Discovers frontend services from config.json.
 * Returns folder names (containerName) for each UI.
 */
function discoverFrontendServices(): string[] {
  const services: string[] = [];

  for (const [key, value] of Object.entries(config.uis || {})) {
    if (key.startsWith('UI_')) {
      const containerName = (value as { containerName: string }).containerName;
      services.push(containerName);
    }
  }

  return services.sort();
}

/**
 * Discovers packages from config.json packages section.
 * Falls back to scanning packages directory if not defined in config.
 */
function discoverPackages(): string[] {
  const packagesDir = resolve(rootDir, 'packages');
  const packages: string[] = [];

  // Get package names from config.packages keys
  const configPackages = Object.keys(config.packages || {});

  if (configPackages.length > 0) {
    // Use packages defined in config
    for (const pkgName of configPackages) {
      const fullPath = resolve(packagesDir, pkgName);
      const packageJsonPath = resolve(fullPath, 'package.json');
      // Verify the package exists
      try {
        if (statSync(fullPath).isDirectory() && statSync(packageJsonPath).isFile()) {
          packages.push(pkgName);
        }
      } catch {
        // Package directory doesn't exist, skip
      }
    }
  } else {
    // Fallback: scan packages directory
    try {
      const entries = readdirSync(packagesDir);

      for (const entry of entries) {
        const fullPath = resolve(packagesDir, entry);
        const packageJsonPath = resolve(fullPath, 'package.json');
        // Only include directories that have a package.json
        if (statSync(fullPath).isDirectory() && statSync(packageJsonPath).isFile()) {
          packages.push(entry);
        }
      }
    } catch {
      // Directory might not exist
    }
  }

  return packages.sort();
}

/**
 * Builds a list of unified tasks based on CLI options.
 */
function buildUnifiedTasks(options: {
  lintBackends: boolean;
  lintFrontends: boolean;
  lintPackages: boolean;
  specificBackends?: string[];
  specificFrontends?: string[];
  specificPackages?: string[];
}): UnifiedTask[] {
  const tasks: UnifiedTask[] = [];

  // Build backend tasks
  if (options.lintBackends) {
    const allBackends = discoverBackendServices();
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
    const allFrontends = discoverFrontendServices();
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

  // Build package tasks
  if (options.lintPackages) {
    const allPackages = discoverPackages();
    const packages = options.specificPackages && options.specificPackages.length > 0
      ? allPackages.filter(p => options.specificPackages!.includes(p))
      : allPackages;

    // Validate requested packages exist
    if (options.specificPackages && options.specificPackages.length > 0) {
      const invalidPackages = options.specificPackages.filter(p => !allPackages.includes(p));
      if (invalidPackages.length > 0) {
        console.error(`Error: Invalid package(s): ${invalidPackages.join(', ')}`);
        console.error(`Available packages: ${allPackages.join(', ')}`);
        process.exit(1);
      }
    }

    for (const pkg of packages) {
      const subtasks = createPackageTasks(pkg, rootDir);
      // Only add if there are subtasks to run
      if (subtasks.length > 0) {
        tasks.push({
          id: pkg,
          name: pkg,
          type: 'package',
          subtasks,
        });
      }
    }
  }

  return tasks;
}

// List command - lists all available services
program
  .command('list')
  .description('List all available services and packages')
  .option('--backends', 'List only backend services')
  .option('--frontends', 'List only frontend services')
  .option('--packages', 'List only packages')
  .action((options) => {
    const backendServices = discoverBackendServices();
    const frontendServices = discoverFrontendServices();
    const packageNames = discoverPackages();

    const showAll = !options.backends && !options.frontends && !options.packages;

    if (showAll) {
      // Show all
      console.log('Available services and packages:\n');

      if (backendServices.length > 0) {
        console.log('Backend services:');
        backendServices.forEach(name => {
          console.log(`  - ${name}`);
        });
        console.log('');
      }

      if (frontendServices.length > 0) {
        console.log('Frontend services:');
        frontendServices.forEach(name => {
          console.log(`  - ${name}`);
        });
        console.log('');
      }

      if (packageNames.length > 0) {
        console.log('Packages:');
        packageNames.forEach(name => {
          console.log(`  - ${name}`);
        });
        console.log('');
      }
    } else if (options.backends) {
      console.log('Backend services:');
      backendServices.forEach(name => {
        console.log(`  - ${name}`);
      });
    } else if (options.frontends) {
      console.log('Frontend services:');
      frontendServices.forEach(name => {
        console.log(`  - ${name}`);
      });
    } else if (options.packages) {
      console.log('Packages:');
      packageNames.forEach(name => {
        console.log(`  - ${name}`);
      });
    }
  });

// Lint command - lint services with optional filtering
program
  .command('lint')
  .description('Lint services and packages (all by default)')
  .option('--ci', 'Use CI mode (streaming output)')
  .option('--concurrency <number>', 'Max concurrent services to lint', '5')
  .option('--backends [services...]', 'Lint only specified backend services (or all if no services specified)')
  .option('--frontends [services...]', 'Lint only specified frontend services (or all if no services specified)')
  .option('--packages [packages...]', 'Lint only specified packages (or all if no packages specified)')
  .action(async (options) => {
    const isCIMode = options.ci || false;

    // Determine what to lint based on which flags are specified
    const hasBackendsFlag = options.backends !== undefined;
    const hasFrontendsFlag = options.frontends !== undefined;
    const hasPackagesFlag = options.packages !== undefined;
    const hasAnyFlag = hasBackendsFlag || hasFrontendsFlag || hasPackagesFlag;

    // If no flags specified, lint everything. Otherwise, only lint what's specified.
    const lintBackends = hasAnyFlag ? hasBackendsFlag : true;
    const lintFrontends = hasAnyFlag ? hasFrontendsFlag : true;
    const lintPackages = hasAnyFlag ? hasPackagesFlag : true;

    const specificBackends = Array.isArray(options.backends) ? options.backends : undefined;
    const specificFrontends = Array.isArray(options.frontends) ? options.frontends : undefined;
    const specificPackages = Array.isArray(options.packages) ? options.packages : undefined;

    // Build unified task list
    const unifiedTasks = buildUnifiedTasks({
      lintBackends,
      lintFrontends,
      lintPackages,
      specificBackends,
      specificFrontends,
      specificPackages,
    });

    if (unifiedTasks.length === 0) {
      console.log('No services or packages to lint.');
      process.exit(0);
    }

    // Combine all task names for the reporter
    const allTaskNames: Record<string, string> = {
      ...BACKEND_TASK_NAMES,
      ...FRONTEND_TASK_NAMES,
      ...PACKAGE_TASK_NAMES,
    };

    // Create reporter
    const reporter = isCIMode
      ? new CIReporter(allTaskNames)
      : new CLIReporter(allTaskNames);

    // Header
    if (!isCIMode) {
      console.log('\x1b[0;34m========================================\x1b[0m');
      console.log('\x1b[0;34m  Linting Services & Packages\x1b[0m');
      console.log('\x1b[0;34m========================================\x1b[0m');
      console.log('');
    } else {
      console.log('\x1b[0;34m========================================\x1b[0m');
      console.log('\x1b[0;34m  Linting Services & Packages (CI Mode)\x1b[0m');
      console.log('\x1b[0;34m========================================\x1b[0m');
      console.log('');
    }

    // Show what we're linting
    const backendTasks = unifiedTasks.filter(t => t.type === 'backend');
    const frontendTasks = unifiedTasks.filter(t => t.type === 'frontend');
    const packageTasks = unifiedTasks.filter(t => t.type === 'package');

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

    if (specificPackages && specificPackages.length > 0) {
      console.log(`\x1b[0;36mLinting specific package(s): ${specificPackages.join(', ')}\x1b[0m`);
    } else if (packageTasks.length > 0) {
      console.log(`\x1b[0;36mDiscovered ${packageTasks.length} package(s)\x1b[0m`);
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
