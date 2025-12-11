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

export interface SummaryStats {
  totalServices: number;
  totalTasks: number;
  passedServices: number;
  failedServices: number;
  passedTasks: number;
  failedTasks: number;
}
