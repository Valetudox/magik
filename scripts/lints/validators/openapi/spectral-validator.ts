import { execSync } from 'child_process';
import type { TaskResult } from '../../types';

export interface SpectralValidationResult {
  success: boolean;
  errors?: string[];
  output?: string;
}

/**
 * Validates OpenAPI specifications using Spectral linter.
 * Runs spectral against all backend service openapi.yaml files.
 */
export function validateOpenAPISpecs(rootDir: string): SpectralValidationResult {
  try {
    const output = execSync(
      'node node_modules/.bin/spectral lint "apps/backend-*/openapi.yaml" --format stylish',
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
 */
export async function runSpectralValidation(rootDir: string): Promise<TaskResult> {
  const result = validateOpenAPISpecs(rootDir);

  return {
    success: result.success,
    output: result.success ? result.output : undefined,
    error: result.errors ? result.errors.join('\n') : undefined,
  };
}
