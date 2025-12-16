import pAll from 'p-all';
import type { Reporter, E2EProjectStatus, TaskStatus, E2EProject, E2ETask, ExecutorOptions } from './types';

/**
 * E2E test executor that handles running tests for multiple projects.
 */
export class E2EExecutor {
  private rootDir: string;
  private reporter: Reporter;
  private options: ExecutorOptions;
  private projects: Map<string, E2EProjectStatus> = new Map();

  constructor(rootDir: string, reporter: Reporter, options: ExecutorOptions) {
    this.rootDir = rootDir;
    this.reporter = reporter;
    this.options = options;
  }

  /**
   * Executes all e2e projects and reports progress.
   * Returns true if all tasks passed, false otherwise.
   */
  async execute(projects: E2EProject[]): Promise<boolean> {
    if (projects.length === 0) {
      return true;
    }

    // Initialize project statuses for all projects
    for (const project of projects) {
      const taskStatuses = new Map<string, TaskStatus>();

      for (const task of project.tasks) {
        taskStatuses.set(task.id, {
          state: 'waiting',
        });
      }

      this.projects.set(project.id, {
        project: project.id,
        tasks: taskStatuses,
      });
    }

    // Run all projects with controlled concurrency
    await pAll(
      projects.map(project => () => this.executeProject(project)),
      { concurrency: this.options.maxConcurrency }
    );

    // Notify completion
    this.reporter.onComplete(this.projects);

    // Check if all tasks passed
    return this.allTasksPassed();
  }

  /**
   * Executes a single e2e project with its tasks.
   */
  private async executeProject(project: E2EProject): Promise<void> {
    // Notify project started
    this.reporter.onProgress({
      type: 'project_started',
      project: project.id,
      allProjects: this.projects,
    });

    // Run tasks sequentially
    for (const task of project.tasks) {
      await this.executeTask(project.id, task);
    }

    // Notify project completed
    this.reporter.onProgress({
      type: 'project_completed',
      project: project.id,
      allProjects: this.projects,
    });
  }

  /**
   * Executes a single task within a project.
   */
  private async executeTask(projectId: string, task: E2ETask): Promise<void> {
    const projectStatus = this.projects.get(projectId);
    if (!projectStatus) return;

    const taskStatus = projectStatus.tasks.get(task.id);
    if (!taskStatus) return;

    // Update status to in_progress
    taskStatus.state = 'in_progress';
    taskStatus.startTime = Date.now();

    this.reporter.onProgress({
      type: 'task_started',
      project: projectId,
      taskId: task.id,
      status: taskStatus,
      allProjects: this.projects,
    });

    // Execute the task
    try {
      const result = await task.command();
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
      project: projectId,
      taskId: task.id,
      status: taskStatus,
      allProjects: this.projects,
    });
  }

  /**
   * Checks if all tasks passed.
   */
  private allTasksPassed(): boolean {
    for (const [, projectStatus] of this.projects) {
      for (const [, taskStatus] of projectStatus.tasks) {
        if (taskStatus.state === 'failed' || (taskStatus.state === 'done' && !taskStatus.result?.success)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Returns the current projects map (useful for testing).
   */
  getProjects(): Map<string, E2EProjectStatus> {
    return this.projects;
  }
}
