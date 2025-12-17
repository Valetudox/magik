import { join } from 'path';
import { execSync } from 'child_process';
import type { LintTask, TaskResult } from '../types';
import { validateStructure, validateConfig, validateRouteActions, validateIndexStructure, validateDockerfile, validateE2EExists } from '../validators/backend';
import { validateBackendOpenAPI } from '../validators/openapi';

export const BACKEND_TASK_NAMES: Record<string, string> = {
  eslint: 'ESLint',
  structure: 'Structure validation',
  dockerfile: 'Dockerfile template validation',
  'index-structure': 'Index.ts structure validation',
  config: 'Config extends validation',
  routes: 'Route-action alignment',
  openapi: 'OpenAPI validation',
  'e2e-exists': 'E2E test existence',
};

export function createBackendTasks(service: string, rootDir: string): LintTask[] {
  const serviceDir = join(rootDir, 'apps', service);

  return [
    {
      id: 'eslint',
      name: 'ESLint',
      command: async (): Promise<TaskResult> => {
        try {
          const output = execSync('bun run lint', {
            cwd: serviceDir,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
          });

          return {
            success: true,
            output,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.stdout || error.stderr || error.message,
          };
        }
      },
    },
    {
      id: 'structure',
      name: 'Structure validation',
      command: async (): Promise<TaskResult> => {
        try {
          const result = validateStructure(service, serviceDir);

          return {
            success: result.success,
            output: result.success ? 'Structure validation passed' : undefined,
            error: result.errors ? result.errors.join('\n') : undefined,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || String(error),
          };
        }
      },
    },
    {
      id: 'dockerfile',
      name: 'Dockerfile template validation',
      command: async (): Promise<TaskResult> => {
        try {
          const result = validateDockerfile(service, serviceDir);

          return {
            success: result.success,
            output: result.success ? 'Dockerfile matches template' : undefined,
            error: result.errors ? result.errors.join('\n') : undefined,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || String(error),
          };
        }
      },
    },
    {
      id: 'index-structure',
      name: 'Index.ts structure validation',
      command: async (): Promise<TaskResult> => {
        try {
          const result = validateIndexStructure(service, serviceDir, rootDir);

          return {
            success: result.success,
            output: result.success ? result.output : undefined,
            error: result.errors ? result.errors.join('\n') : undefined,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || String(error),
          };
        }
      },
    },
    {
      id: 'config',
      name: 'Config extends validation',
      command: async (): Promise<TaskResult> => {
        try {
          const result = validateConfig(service, serviceDir);

          return {
            success: result.success,
            output: result.success ? 'Config validation passed' : undefined,
            error: result.errors ? result.errors.join('\n') : undefined,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || String(error),
          };
        }
      },
    },
    {
      id: 'routes',
      name: 'Route-action alignment',
      command: async (): Promise<TaskResult> => {
        try {
          const result = validateRouteActions(service, serviceDir);

          return {
            success: result.success,
            output: result.success ? 'Route-action validation passed' : undefined,
            error: result.errors ? result.errors.join('\n') : undefined,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || String(error),
          };
        }
      },
    },
    {
      id: 'openapi',
      name: 'OpenAPI validation',
      command: async (): Promise<TaskResult> => {
        try {
          const result = validateBackendOpenAPI(service, rootDir);

          return {
            success: result.success,
            output: result.success ? result.output : undefined,
            error: result.errors ? result.errors.join('\n') : undefined,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || String(error),
          };
        }
      },
    },
    {
      id: 'e2e-exists',
      name: 'E2E test existence',
      command: async (): Promise<TaskResult> => {
        try {
          const result = validateE2EExists(service, rootDir);

          return {
            success: result.success,
            output: result.success ? result.output : undefined,
            error: result.errors ? result.errors.join('\n') : undefined,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || String(error),
          };
        }
      },
    },
  ];
}
