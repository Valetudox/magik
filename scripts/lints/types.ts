export type TaskState = 'waiting' | 'in_progress' | 'done' | 'failed';

export interface TaskResult {
  success: boolean;
  output?: string;
  error?: string;
  duration?: number;
}

export interface LintTask {
  id: string;
  name: string;
  command: () => Promise<TaskResult>;
}

export interface TaskStatus {
  state: TaskState;
  result?: TaskResult;
  startTime?: number;
  endTime?: number;
}

export interface ServiceStatus {
  service: string;
  tasks: Map<string, TaskStatus>;
}

export interface ProgressEvent {
  type: 'task_started' | 'task_completed' | 'service_started' | 'service_completed' | 'all_completed';
  service?: string;
  taskId?: string;
  status?: TaskStatus;
  allServices?: Map<string, ServiceStatus>;
}

export interface Reporter {
  onProgress(event: ProgressEvent): void;
  onComplete(services: Map<string, ServiceStatus>): void;
}

export interface LinterConfig {
  mode: 'ci' | 'cli';
  rootDir: string;
}

export interface ExecutorOptions {
  /** Max number of services to run concurrently */
  maxConcurrency: number;
}

export interface SummaryStats {
  totalServices: number;
  totalTasks: number;
  passedServices: number;
  failedServices: number;
  passedTasks: number;
  failedTasks: number;
}

/**
 * Unified task type representing a complete linting target.
 * All task types (backend, frontend, openapi) follow the same structure.
 */
export type UnifiedTaskType = 'backend' | 'frontend' | 'package' | 'openapi';

export interface UnifiedTask {
  /** Unique identifier, e.g., "backend-decision", "ui-decision", "openapi" */
  id: string;
  /** Display name shown in output */
  name: string;
  /** Type of task for categorization */
  type: UnifiedTaskType;
  /** Subtasks to execute for this unified task */
  subtasks: LintTask[];
}

/**
 * Configuration for building unified tasks
 */
export interface UnifiedTaskConfig {
  /** Task type for grouping */
  type: UnifiedTaskType;
  /** Prefix for service discovery, e.g., 'backend-' or 'ui-' */
  servicePrefix?: string;
  /** Function to create subtasks for a service */
  createTasks: (service: string, rootDir: string) => LintTask[];
  /** Task names mapping for display */
  taskNames: Record<string, string>;
}
