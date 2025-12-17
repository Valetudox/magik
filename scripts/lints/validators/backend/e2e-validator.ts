import { join } from 'path';
import { existsSync, statSync } from 'fs';
import type { ValidationResult } from './types';

/**
 * Validates that a backend service has a corresponding e2e test project.
 * E2E test projects should be in tests/e2e/{serviceName}-e2e/
 */
export function validateE2EExists(
  serviceName: string,
  rootDir: string
): ValidationResult {
  const e2eProjectName = `${serviceName}-e2e`;
  const e2eProjectPath = join(rootDir, 'tests', 'e2e', e2eProjectName);
  const packageJsonPath = join(e2eProjectPath, 'package.json');

  const errors: string[] = [];

  // Check if e2e directory exists
  if (!existsSync(e2eProjectPath)) {
    errors.push(`Missing e2e test project at tests/e2e/${e2eProjectName}/`);
    return { success: false, errors };
  }

  // Check if it's a directory
  if (!statSync(e2eProjectPath).isDirectory()) {
    errors.push(`tests/e2e/${e2eProjectName} exists but is not a directory`);
    return { success: false, errors };
  }

  // Check if package.json exists
  if (!existsSync(packageJsonPath)) {
    errors.push(`E2E project exists but missing package.json at tests/e2e/${e2eProjectName}/package.json`);
    return { success: false, errors };
  }

  return {
    success: true,
    output: `E2E test project exists at tests/e2e/${e2eProjectName}/`,
  };
}
