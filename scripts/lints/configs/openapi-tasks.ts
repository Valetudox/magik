import type { LintTask, TaskResult } from '../types';
import { runSpectralValidation } from '../validators/openapi';

export const OPENAPI_TASK_NAMES: Record<string, string> = {
  spectral: 'Spectral validation',
  // Future subtasks can be added here, e.g.:
  // 'schema-consistency': 'Schema consistency check',
  // 'endpoint-naming': 'Endpoint naming conventions',
};

/**
 * Creates OpenAPI validation tasks.
 * Following the same pattern as backend-tasks.ts and frontend-tasks.ts.
 */
export function createOpenAPITasks(rootDir: string): LintTask[] {
  return [
    {
      id: 'spectral',
      name: 'Spectral validation',
      command: async (): Promise<TaskResult> => {
        return runSpectralValidation(rootDir);
      },
    },
    // Additional subtasks can be added here in the future
  ];
}
