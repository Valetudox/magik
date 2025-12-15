#!/usr/bin/env bun

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Command } from 'commander';
import { LinterRunner } from '../runner/linter-runner';
import { CIReporter } from '../reporters/ci-reporter';
import { CLIReporter } from '../reporters/cli-reporter';
import { createFrontendTasks, FRONTEND_TASK_NAMES } from '../configs/frontend-tasks';

// Get root directory (3 levels up from this script)
const scriptDir = resolve(dirname(fileURLToPath(import.meta.url)));
const rootDir = resolve(scriptDir, '..', '..', '..');

const program = new Command();

program
  .name('lint-frontend')
  .description('Frontend services linting tool')
  .version('1.0.0');

program
  .command('list')
  .description('List all available frontend services')
  .requiredOption('--mode <mode>', 'Output mode (ci or cli)', validateMode)
  .action(async (options) => {
    const mode = options.mode as 'ci' | 'cli';
    const reporter = mode === 'ci' ? new CIReporter(FRONTEND_TASK_NAMES) : new CLIReporter(FRONTEND_TASK_NAMES);
    const runner = new LinterRunner(rootDir, reporter, {
      serviceType: 'frontend',
      servicePrefix: 'ui-',
      createTasks: createFrontendTasks,
    });
    const services = runner.getServices();

    if (services.length === 0) {
      console.log('No frontend services found');
    } else {
      console.log('Available frontend services:');
      for (const service of services) {
        console.log(`  - ${service}`);
      }
    }
  });

program
  .command('lint')
  .description('Lint frontend services')
  .requiredOption('--mode <mode>', 'Output mode (ci or cli)', validateMode)
  .argument('[services...]', 'Specific services to lint (optional)')
  .action(async (services: string[], options) => {
    const mode = options.mode as 'ci' | 'cli';
    const reporter = mode === 'ci' ? new CIReporter(FRONTEND_TASK_NAMES) : new CLIReporter(FRONTEND_TASK_NAMES);

    // Header for CI mode
    if (mode === 'ci') {
      console.log('\x1b[0;34m========================================\x1b[0m');
      console.log('\x1b[0;34m  Frontend Services Linting\x1b[0m');
      console.log('\x1b[0;34m========================================\x1b[0m');
      console.log('');

      if (services.length > 0) {
        console.log(`\x1b[0;36mLinting specific service(s): ${services.join(', ')}\x1b[0m`);
        console.log('');
      }
    }

    // Run linter
    const runner = new LinterRunner(
      rootDir,
      reporter,
      {
        serviceType: 'frontend',
        servicePrefix: 'ui-',
        createTasks: createFrontendTasks,
      },
      services.length > 0 ? services : undefined
    );
    const success = await runner.run();

    // Exit with appropriate code
    process.exit(success ? 0 : 1);
  });

function validateMode(value: string): string {
  if (value !== 'ci' && value !== 'cli') {
    throw new Error(`Invalid mode: ${value}. Must be 'ci' or 'cli'`);
  }
  return value;
}

program.parse();
