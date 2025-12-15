#!/usr/bin/env bun

import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { LinterRunner } from './runner/linter-runner';
import { CIReporter } from './reporters/ci-reporter';
import { CLIReporter } from './reporters/cli-reporter';
import { createBackendTasks, BACKEND_TASK_NAMES } from './configs/backend-tasks';
import { createFrontendTasks, FRONTEND_TASK_NAMES } from './configs/frontend-tasks';
import { execSync } from 'child_process';

// Get root directory
const scriptDir = resolve(dirname(fileURLToPath(import.meta.url)));
const rootDir = resolve(scriptDir, '..', '..');

// Parse command line args
const args = process.argv.slice(2);
const isCIMode = args.includes('--ci');

console.log('\x1b[0;34m========================================\x1b[0m');
console.log('\x1b[0;34m  Linting All Services\x1b[0m');
console.log('\x1b[0;34m========================================\x1b[0m');
console.log('');

let allPassed = true;

// Read config to get service counts
const configPath = resolve(rootDir, 'config/config.json');
const config = JSON.parse(readFileSync(configPath, 'utf-8'));

const backendCount = Object.keys(config.services || {}).filter(k => k.startsWith('BACKEND_')).length;
const frontendCount = Object.keys(config.uis || {}).length;

console.log(`\x1b[0;36mDiscovered ${backendCount} backend services and ${frontendCount} frontend services from config\x1b[0m`);
console.log('');

// Lint backends
if (backendCount > 0) {
  console.log('\x1b[0;34m========================================\x1b[0m');
  console.log('\x1b[0;34m  Backend Services\x1b[0m');
  console.log('\x1b[0;34m========================================\x1b[0m');
  console.log('');

  const backendReporter = isCIMode ? new CIReporter(BACKEND_TASK_NAMES) : new CLIReporter(BACKEND_TASK_NAMES);
  const backendRunner = new LinterRunner(rootDir, backendReporter, {
    serviceType: 'backend',
    servicePrefix: 'backend-',
    createTasks: createBackendTasks,
  });

  const backendSuccess = await backendRunner.run();
  if (!backendSuccess) allPassed = false;

  console.log('');
}

// Lint frontends
if (frontendCount > 0) {
  console.log('\x1b[0;34m========================================\x1b[0m');
  console.log('\x1b[0;34m  Frontend Services\x1b[0m');
  console.log('\x1b[0;34m========================================\x1b[0m');
  console.log('');

  const frontendReporter = isCIMode ? new CIReporter(FRONTEND_TASK_NAMES) : new CLIReporter(FRONTEND_TASK_NAMES);
  const frontendRunner = new LinterRunner(rootDir, frontendReporter, {
    serviceType: 'frontend',
    servicePrefix: 'ui-',
    createTasks: createFrontendTasks,
  });

  const frontendSuccess = await frontendRunner.run();
  if (!frontendSuccess) allPassed = false;

  console.log('');
}

// Lint OpenAPI specs
console.log('\x1b[0;34m========================================\x1b[0m');
console.log('\x1b[0;34m  OpenAPI Specifications\x1b[0m');
console.log('\x1b[0;34m========================================\x1b[0m');
console.log('');

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

// Final summary
console.log('\x1b[0;34m========================================\x1b[0m');
console.log('\x1b[0;34m  Final Summary\x1b[0m');
console.log('\x1b[0;34m========================================\x1b[0m');
console.log('');

if (allPassed) {
  console.log('\x1b[0;32m✓ All linting checks passed!\x1b[0m');
  process.exit(0);
} else {
  console.log('\x1b[0;31m✗ Some linting checks failed\x1b[0m');
  process.exit(1);
}
