import { join } from 'path';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import type { LintTask, TaskResult } from '../types';

export const PACKAGE_TASK_NAMES: Record<string, string> = {
  eslint: 'ESLint',
  tsc: 'TypeScript (tsc)',
};

export function createPackageTasks(packageName: string, rootDir: string): LintTask[] {
  const packageDir = join(rootDir, 'packages', packageName);
  const tasks: LintTask[] = [];

  // Check if package has lint script
  const packageJsonPath = join(packageDir, 'package.json');
  let hasLintScript = false;
  let hasTsConfig = false;

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    hasLintScript = !!packageJson.scripts?.lint;
  } catch {
    // Package.json doesn't exist or is invalid
  }

  hasTsConfig = existsSync(join(packageDir, 'tsconfig.json'));

  // ESLint task (only if lint script exists)
  if (hasLintScript) {
    tasks.push({
      id: 'eslint',
      name: 'ESLint',
      command: async (): Promise<TaskResult> => {
        try {
          const output = execSync('bun run lint', {
            cwd: packageDir,
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
    });
  }

  // TypeScript check (only if tsconfig.json exists)
  if (hasTsConfig) {
    tasks.push({
      id: 'tsc',
      name: 'TypeScript (tsc)',
      command: async (): Promise<TaskResult> => {
        try {
          const output = execSync('bunx tsc --noEmit', {
            cwd: packageDir,
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
          });

          return {
            success: true,
            output: output || 'TypeScript check passed',
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.stdout || error.stderr || error.message,
          };
        }
      },
    });
  }

  return tasks;
}
