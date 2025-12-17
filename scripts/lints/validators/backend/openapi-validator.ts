import { execSync } from 'child_process';
import { join, resolve } from 'path';
import type { TaskResult } from '../../types';

export interface SpectralValidationResult {
  success: boolean;
  errors?: string[];
  output?: string;
}

/**
 * Validates a single OpenAPI specification using Spectral linter.
 * Runs spectral against a specific backend's openapi.yaml file.
 */
export function validateBackendOpenAPI(
  serviceName: string,
  rootDir: string
): SpectralValidationResult {
  // Extract domain name from service name (backend-{domain} -> {domain})
  const domain = serviceName.replace(/^backend-/, '');
  const openapiPath = join('specs', 'domains', domain, 'openapi.yaml');
  const absolutePath = resolve(rootDir, openapiPath);

  try {
    const output = execSync(
      `node node_modules/.bin/spectral lint "${openapiPath}" --format stylish`,
      {
        cwd: rootDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );

    return {
      success: true,
      output: output || `OpenAPI validation passed for ${domain}`,
    };
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string; message?: string };
    return {
      success: false,
      errors: [execError.stdout || execError.stderr || execError.message || 'OpenAPI validation failed'],
    };
  }
}

/**
 * Validates OpenAPI specifications using Spectral linter.
 * Runs spectral against all openapi.yaml files in specs/domains/.
 * @deprecated Use validateBackendOpenAPI for per-backend validation
 */
export function validateOpenAPISpecs(rootDir: string): SpectralValidationResult {
  try {
    const output = execSync(
      'node node_modules/.bin/spectral lint "specs/domains/*/openapi.yaml" --format stylish',
      {
        cwd: rootDir,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );

    return {
      success: true,
      output: output || 'OpenAPI validation passed',
    };
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string; message?: string };
    return {
      success: false,
      errors: [execError.stdout || execError.stderr || execError.message || 'OpenAPI validation failed'],
    };
  }
}

/**
 * Creates a TaskResult from the Spectral validation result.
 * @deprecated Use validateBackendOpenAPI in backend tasks instead
 */
export async function runSpectralValidation(rootDir: string): Promise<TaskResult> {
  const result = validateOpenAPISpecs(rootDir);

  return {
    success: result.success,
    output: result.success ? result.output : undefined,
    error: result.errors ? result.errors.join('\n') : undefined,
  };
}
