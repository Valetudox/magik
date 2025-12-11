#!/usr/bin/env bun

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { BackendLinterRunner } from './runner/backend-linter-runner';
import { CIReporter } from './reporters/ci-reporter';
import { CLIReporter } from './reporters/cli-reporter';

// Parse command line arguments
function parseArgs(): { mode: 'ci' | 'cli' | null } {
  const args = process.argv.slice(2);

  for (const arg of args) {
    if (arg === '--mode=ci') {
      return { mode: 'ci' };
    } else if (arg === '--mode=cli') {
      return { mode: 'cli' };
    }
  }

  return { mode: null };
}

async function main() {
  const args = parseArgs();

  // Mode argument is required
  if (!args.mode) {
    console.error('Error: --mode argument is required');
    console.error('Usage: lint-backend.ts --mode=<ci|cli>');
    process.exit(1);
  }

  const mode = args.mode;

  // Get root directory (3 levels up from this script)
  const scriptDir = resolve(dirname(fileURLToPath(import.meta.url)));
  const rootDir = resolve(scriptDir, '..', '..', '..');

  // Create appropriate reporter
  const reporter = mode === 'ci' ? new CIReporter() : new CLIReporter();

  // Header for CI mode
  if (mode === 'ci') {
    console.log('\x1b[0;34m========================================\x1b[0m');
    console.log('\x1b[0;34m  Backend Services Linting\x1b[0m');
    console.log('\x1b[0;34m========================================\x1b[0m');
    console.log('');

    // Show discovered services
    const { readdirSync, statSync } = await import('fs');
    const { join } = await import('path');
    const appsDir = join(rootDir, 'apps');
    const services: string[] = [];

    try {
      const entries = readdirSync(appsDir);
      for (const entry of entries) {
        if (entry.startsWith('backend-')) {
          const fullPath = join(appsDir, entry);
          if (statSync(fullPath).isDirectory()) {
            services.push(entry);
          }
        }
      }
    } catch (error) {
      // Ignore errors
    }

    if (services.length > 0) {
      console.log(`\x1b[0;36mFound ${services.length} backend service(s): ${services.join(', ')}\x1b[0m`);
      console.log('');
    }
  }

  // Run linter
  const runner = new BackendLinterRunner(rootDir, reporter);
  const success = await runner.run();

  // Exit with appropriate code
  process.exit(success ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
