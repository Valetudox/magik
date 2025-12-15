import { join } from 'path';
import { execSync } from 'child_process';
import type { LintTask, TaskResult } from '../types';
import { validateDockerfile } from '../validators/frontend/dockerfile-validator';

export const FRONTEND_TASK_NAMES: Record<string, string> = {
  eslint: 'ESLint',
  'vue-tsc': 'TypeScript (vue-tsc)',
  'vite-build': 'Vite build check',
  dockerfile: 'Dockerfile template validation',
};

export function createFrontendTasks(service: string, rootDir: string): LintTask[] {
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
      id: 'vue-tsc',
      name: 'TypeScript (vue-tsc)',
      command: async (): Promise<TaskResult> => {
        try {
          const output = execSync('bunx vue-tsc --noEmit', {
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
      id: 'vite-build',
      name: 'Vite build check',
      command: async (): Promise<TaskResult> => {
        try {
          // Just check if vite config is valid, don't actually build
          const output = execSync('bunx vite build --mode development --logLevel silent', {
            cwd: serviceDir,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: 60000, // 60 second timeout
          });

          return {
            success: true,
            output: 'Vite build check passed',
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
      id: 'dockerfile',
      name: 'Dockerfile template validation',
      command: async (): Promise<TaskResult> => {
        const result = validateDockerfile(service, serviceDir);

        if (result.success) {
          return {
            success: true,
            output: 'Dockerfile matches template',
          };
        } else {
          return {
            success: false,
            error: result.errors?.join('\n') || 'Dockerfile validation failed',
          };
        }
      },
    },
  ];
}
