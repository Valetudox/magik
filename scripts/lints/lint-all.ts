#!/usr/bin/env bun

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { Command } from 'commander';
import { LinterRunner } from './runner/linter-runner';
import { CIReporter } from './reporters/ci-reporter';
import { CLIReporter } from './reporters/cli-reporter';
import { createBackendTasks, BACKEND_TASK_NAMES } from './configs/backend-tasks';
import { createFrontendTasks, FRONTEND_TASK_NAMES } from './configs/frontend-tasks';
import { execSync } from 'child_process';

// Get root directory
const scriptDir = resolve(dirname(fileURLToPath(import.meta.url)));
const rootDir = resolve(scriptDir, '..', '..');

const program = new Command();

program
  .name('lint')
  .description('Unified linting tool for all services')
  .version('1.0.0');

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
  .option('--backends [services...]', 'Lint only specified backend services (or all if no services specified)')
  .option('--frontends [services...]', 'Lint only specified frontend services (or all if no services specified)')
  .option('--skip-openapi', 'Skip OpenAPI validation')
  .action(async (options) => {
    const isCIMode = options.ci || false;
    const skipOpenAPI = options.skipOpenapi || false;

    // Determine what to lint
    const lintBackends = !options.frontends; // Lint backends unless only frontends specified
    const lintFrontends = !options.backends; // Lint frontends unless only backends specified
    const specificBackends = Array.isArray(options.backends) ? options.backends : undefined;
    const specificFrontends = Array.isArray(options.frontends) ? options.frontends : undefined;

    // Read config to get service counts
    const configPath = resolve(rootDir, 'config/config.json');
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));

    const backendCount = Object.keys(config.services || {}).filter(k => k.startsWith('BACKEND_')).length;
    const frontendCount = Object.keys(config.uis || {}).length;

    let allPassed = true;

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

    if (specificBackends && specificBackends.length > 0) {
      console.log(`\x1b[0;36mLinting specific backend(s): ${specificBackends.join(', ')}\x1b[0m`);
    } else if (lintBackends) {
      console.log(`\x1b[0;36mDiscovered ${backendCount} backend services from config\x1b[0m`);
    }

    if (specificFrontends && specificFrontends.length > 0) {
      console.log(`\x1b[0;36mLinting specific frontend(s): ${specificFrontends.join(', ')}\x1b[0m`);
    } else if (lintFrontends) {
      console.log(`\x1b[0;36mDiscovered ${frontendCount} frontend services from config\x1b[0m`);
    }

    console.log('');

    // Lint backends
    if (lintBackends && backendCount > 0) {
      if (!isCIMode) {
        console.log('\x1b[0;34m========================================\x1b[0m');
        console.log('\x1b[0;34m  Backend Services\x1b[0m');
        console.log('\x1b[0;34m========================================\x1b[0m');
        console.log('');
      }

      const backendReporter = isCIMode ? new CIReporter(BACKEND_TASK_NAMES) : new CLIReporter(BACKEND_TASK_NAMES);
      const backendRunner = new LinterRunner(
        rootDir,
        backendReporter,
        {
          serviceType: 'backend',
          servicePrefix: 'backend-',
          createTasks: createBackendTasks,
        },
        specificBackends
      );

      const backendSuccess = await backendRunner.run();
      if (!backendSuccess) allPassed = false;

      console.log('');
    }

    // Lint frontends
    if (lintFrontends && frontendCount > 0) {
      if (!isCIMode) {
        console.log('\x1b[0;34m========================================\x1b[0m');
        console.log('\x1b[0;34m  Frontend Services\x1b[0m');
        console.log('\x1b[0;34m========================================\x1b[0m');
        console.log('');
      }

      const frontendReporter = isCIMode ? new CIReporter(FRONTEND_TASK_NAMES) : new CLIReporter(FRONTEND_TASK_NAMES);
      const frontendRunner = new LinterRunner(
        rootDir,
        frontendReporter,
        {
          serviceType: 'frontend',
          servicePrefix: 'ui-',
          createTasks: createFrontendTasks,
        },
        specificFrontends
      );

      const frontendSuccess = await frontendRunner.run();
      if (!frontendSuccess) allPassed = false;

      console.log('');
    }

    // Lint OpenAPI specs
    if (!skipOpenAPI) {
      if (!isCIMode) {
        console.log('\x1b[0;34m========================================\x1b[0m');
        console.log('\x1b[0;34m  OpenAPI Specifications\x1b[0m');
        console.log('\x1b[0;34m========================================\x1b[0m');
        console.log('');
      }

      try {
        execSync('node node_modules/.bin/spectral lint "apps/backend-*/openapi.yaml" --format stylish', {
          cwd: rootDir,
          encoding: 'utf-8',
          stdio: 'inherit',
        });
        console.log('\x1b[0;32m✓ OpenAPI validation passed\x1b[0m');
      } catch (error) {
        console.log('\x1b[0;31m✗ OpenAPI validation failed\x1b[0m');
        allPassed = false;
      }

      console.log('');
    }

    // Final summary
    if (!isCIMode) {
      console.log('\x1b[0;34m========================================\x1b[0m');
      console.log('\x1b[0;34m  Final Summary\x1b[0m');
      console.log('\x1b[0;34m========================================\x1b[0m');
      console.log('');
    }

    if (allPassed) {
      console.log('\x1b[0;32m✓ All linting checks passed!\x1b[0m');
      process.exit(0);
    } else {
      console.log('\x1b[0;31m✗ Some linting checks failed\x1b[0m');
      process.exit(1);
    }
  });

// Default command (no subcommand) - runs lint
program
  .action(() => {
    program.parse(['node', 'lint', 'lint', ...process.argv.slice(2)]);
  });

program.parse();
