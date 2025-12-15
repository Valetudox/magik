import type { Reporter, ServiceStatus, TaskStatus, UnifiedTask, LintTask } from '../types';

/**
 * Unified task executor that handles all task types (backend, frontend, openapi)
 * using the same execution pattern.
 */
export class TaskExecutor {
  private rootDir: string;
  private reporter: Reporter;
  private services: Map<string, ServiceStatus> = new Map();

  constructor(rootDir: string, reporter: Reporter) {
    this.rootDir = rootDir;
    this.reporter = reporter;
  }

  /**
   * Executes all unified tasks and reports progress.
   * Returns true if all tasks passed, false otherwise.
   */
  async execute(tasks: UnifiedTask[]): Promise<boolean> {
    if (tasks.length === 0) {
      return true;
    }

    // Initialize service statuses for all tasks
    for (const task of tasks) {
      const taskStatuses = new Map<string, TaskStatus>();

      for (const subtask of task.subtasks) {
        taskStatuses.set(subtask.id, {
          state: 'waiting',
        });
      }

      this.services.set(task.id, {
        service: task.id,
        tasks: taskStatuses,
      });
    }

    // Run all unified tasks concurrently
    await Promise.all(
      tasks.map(task => this.executeUnifiedTask(task))
    );

    // Notify completion
    this.reporter.onComplete(this.services);

    // Check if all tasks passed
    return this.allTasksPassed();
  }

  /**
   * Executes a single unified task with its subtasks.
   */
  private async executeUnifiedTask(task: UnifiedTask): Promise<void> {
    // Notify task started
    this.reporter.onProgress({
      type: 'service_started',
      service: task.id,
      allServices: this.services,
    });

    // Run subtasks sequentially
    for (const subtask of task.subtasks) {
      await this.executeSubtask(task.id, subtask);
    }

    // Notify task completed
    this.reporter.onProgress({
      type: 'service_completed',
      service: task.id,
      allServices: this.services,
    });
  }

  /**
   * Executes a single subtask within a unified task.
   */
  private async executeSubtask(taskId: string, subtask: LintTask): Promise<void> {
    const serviceStatus = this.services.get(taskId);
    if (!serviceStatus) return;

    const taskStatus = serviceStatus.tasks.get(subtask.id);
    if (!taskStatus) return;

    // Update status to in_progress
    taskStatus.state = 'in_progress';
    taskStatus.startTime = Date.now();

    this.reporter.onProgress({
      type: 'task_started',
      service: taskId,
      taskId: subtask.id,
      status: taskStatus,
      allServices: this.services,
    });

    // Execute the subtask
    try {
      const result = await subtask.command();
      taskStatus.state = result.success ? 'done' : 'failed';
      taskStatus.result = result;
      taskStatus.endTime = Date.now();
    } catch (error) {
      taskStatus.state = 'failed';
      taskStatus.result = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
      taskStatus.endTime = Date.now();
    }

    this.reporter.onProgress({
      type: 'task_completed',
      service: taskId,
      taskId: subtask.id,
      status: taskStatus,
      allServices: this.services,
    });
  }

  /**
   * Checks if all tasks passed.
   */
  private allTasksPassed(): boolean {
    for (const [, serviceStatus] of this.services) {
      for (const [, taskStatus] of serviceStatus.tasks) {
        if (taskStatus.state === 'failed' || (taskStatus.state === 'done' && !taskStatus.result?.success)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Returns the current services map (useful for testing).
   */
  getServices(): Map<string, ServiceStatus> {
    return this.services;
  }
}
