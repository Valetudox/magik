export type TaskState = 'waiting' | 'in_progress' | 'done' | 'failed';

export interface TaskResult {
  success: boolean;
  output?: string;
  error?: string;
  duration?: number;
}

export interface E2ETask {
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

export interface E2EProjectStatus {
  project: string;
  tasks: Map<string, TaskStatus>;
}

export interface ProgressEvent {
  type: 'task_started' | 'task_completed' | 'project_started' | 'project_completed' | 'all_completed';
  project?: string;
  taskId?: string;
  status?: TaskStatus;
  allProjects?: Map<string, E2EProjectStatus>;
}

export interface Reporter {
  onProgress(event: ProgressEvent): void;
  onComplete(projects: Map<string, E2EProjectStatus>): void;
}

export interface ExecutorOptions {
  /** Max number of projects to run concurrently */
  maxConcurrency: number;
}

export interface SummaryStats {
  totalProjects: number;
  totalTasks: number;
  passedProjects: number;
  failedProjects: number;
  passedTasks: number;
  failedTasks: number;
}

export interface E2EProject {
  /** Unique identifier, e.g., "backend-audio-e2e" */
  id: string;
  /** Display name shown in output */
  name: string;
  /** Path to the e2e test directory */
  path: string;
  /** Tasks to execute for this project */
  tasks: E2ETask[];
}
