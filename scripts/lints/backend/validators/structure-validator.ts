import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { ValidationResult } from './types';

const REQUIRED_FILES = [
  'Dockerfile',
  'eslint.config.js',
  'package.json',
  'tsconfig.json',
];

const REQUIRED_DIRS = ['src', 'src/actions'];

const REQUIRED_SRC_FILES = ['config.ts', 'index.ts', 'routes.ts', 'types.ts'];

const ALLOWED_SRC_FOLDERS = ['actions', 'services', 'utils'];

export function validateStructure(
  serviceName: string,
  servicePath: string
): ValidationResult {
  const errors: string[] = [];

  // Check required files in service directory
  for (const file of REQUIRED_FILES) {
    const filePath = join(servicePath, file);
    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      errors.push(`Missing file: ${file}`);
    }
  }

  // Check for openapi.yaml in specs/domains/{domain}/
  // Extract domain name from service name (backend-{domain} -> {domain})
  const domain = serviceName.replace(/^backend-/, '');
  const rootDir = resolve(servicePath, '..', '..');
  const openapiPath = join(rootDir, 'specs', 'domains', domain, 'openapi.yaml');

  if (!existsSync(openapiPath) || !statSync(openapiPath).isFile()) {
    errors.push(`Missing file: specs/domains/${domain}/openapi.yaml`);
  }

  // Check required directories
  for (const dir of REQUIRED_DIRS) {
    const dirPath = join(servicePath, dir);
    if (!existsSync(dirPath) || !statSync(dirPath).isDirectory()) {
      errors.push(`Missing directory: ${dir}`);
    }
  }

  // Validate src structure
  const srcPath = join(servicePath, 'src');
  if (existsSync(srcPath) && statSync(srcPath).isDirectory()) {
    // Check required src files
    for (const file of REQUIRED_SRC_FILES) {
      const filePath = join(srcPath, file);
      if (!existsSync(filePath) || !statSync(filePath).isFile()) {
        errors.push(`Missing required file in src: ${file}`);
      }
    }

    // Check for invalid folders in src/
    try {
      const srcEntries = readdirSync(srcPath, { withFileTypes: true });
      for (const entry of srcEntries) {
        if (entry.isDirectory() && !ALLOWED_SRC_FOLDERS.includes(entry.name)) {
          errors.push(
            `Invalid folder in src/: ${entry.name} (only 'actions', 'services', 'utils' are allowed)`
          );
        }
      }
    } catch (error) {
      errors.push(`Failed to read src directory: ${error}`);
    }
  }

  return {
    success: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  };
}
