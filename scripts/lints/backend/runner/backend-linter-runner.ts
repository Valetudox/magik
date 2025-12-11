import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import type { LintTask, Reporter, ServiceStatus, TaskStatus, TaskResult } from '../types';

export class BackendLinterRunner {
  private rootDir: string;
  private reporter: Reporter;
  private services: Map<string, ServiceStatus> = new Map();

  constructor(rootDir: string, reporter: Reporter) {
    this.rootDir = rootDir;
    this.reporter = reporter;
  }

  async run(): Promise<boolean> {
    // Discover backend services
    const backendServices = this.discoverBackendServices();

    if (backendServices.length === 0) {
      console.log('No backend services found');
      return true;
    }

    // Initialize service statuses
    for (const service of backendServices) {
      const tasks = this.createTasksForService(service);
      const taskStatuses = new Map<string, TaskStatus>();

      for (const task of tasks) {
        taskStatuses.set(task.id, {
          state: 'waiting',
        });
      }

      this.services.set(service, {
        service,
        tasks: taskStatuses,
      });
    }

    // Run linting for each service sequentially
    for (const service of backendServices) {
      await this.runServiceLinting(service);
    }

    // Notify completion
    this.reporter.onComplete(this.services);

    // Check if all services passed
    return this.allServicesPassed();
  }

  private discoverBackendServices(): string[] {
    const appsDir = join(this.rootDir, 'apps');
    const services: string[] = [];

    try {
      const entries = readdirSync(appsDir);

      for (const entry of entries) {
        if (entry.startsWith('backend-')) {
          const fullPath = join(appsDir, entry);
          if (statSync(fullPath).isDirectory()) {
            services.push(entry);
          }
        }
      }
    } catch (error) {
      console.error('Error discovering backend services:', error);
    }

    return services.sort();
  }

  private createTasksForService(service: string): LintTask[] {
    const scriptsDir = join(this.rootDir, 'scripts', 'lints');

    return [
      {
        id: 'eslint',
        name: 'ESLint',
        command: async () => this.runESLint(service),
      },
      {
        id: 'structure',
        name: 'Structure validation',
        command: async () => this.runStructureValidation(service),
      },
      {
        id: 'config',
        name: 'Config extends validation',
        command: async () => this.runConfigExtendsValidation(service),
      },
      {
        id: 'routes',
        name: 'Route-action alignment',
        command: async () => this.runRouteActionValidation(service),
      },
    ];
  }

  private async runServiceLinting(service: string): Promise<void> {
    const tasks = this.createTasksForService(service);

    // Notify service started
    this.reporter.onProgress({
      type: 'service_started',
      service,
      allServices: this.services,
    });

    // Run tasks sequentially
    for (const task of tasks) {
      await this.runTask(service, task);
    }

    // Notify service completed
    this.reporter.onProgress({
      type: 'service_completed',
      service,
      allServices: this.services,
    });
  }

  private async runTask(service: string, task: LintTask): Promise<void> {
    const serviceStatus = this.services.get(service);
    if (!serviceStatus) return;

    const taskStatus = serviceStatus.tasks.get(task.id);
    if (!taskStatus) return;

    // Update task status to in_progress
    taskStatus.state = 'in_progress';
    taskStatus.startTime = Date.now();

    this.reporter.onProgress({
      type: 'task_started',
      service,
      taskId: task.id,
      status: taskStatus,
      allServices: this.services,
    });

    // Execute task
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
      service,
      taskId: task.id,
      status: taskStatus,
      allServices: this.services,
    });
  }

  private async runESLint(service: string): Promise<TaskResult> {
    const serviceDir = join(this.rootDir, 'apps', service);

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
  }

  private async runStructureValidation(service: string): Promise<TaskResult> {
    const scriptPath = join(this.rootDir, 'scripts', 'lints', 'backend', 'validate-structure.sh');
    const servicePath = `apps/${service}`;

    try {
      const output = execSync(`"${scriptPath}" "${servicePath}"`, {
        cwd: this.rootDir,
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
  }

  private async runConfigExtendsValidation(service: string): Promise<TaskResult> {
    const scriptPath = join(this.rootDir, 'scripts', 'lints', 'backend', 'validate-config-extends-strict.ts');

    try {
      const output = execSync(`"${scriptPath}" "${service}"`, {
        cwd: this.rootDir,
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
  }

  private async runRouteActionValidation(service: string): Promise<TaskResult> {
    const scriptPath = join(this.rootDir, 'scripts', 'lints', 'backend', 'validate-route-actions.sh');

    try {
      const output = execSync(`"${scriptPath}" "${service}"`, {
        cwd: this.rootDir,
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
  }

  private allServicesPassed(): boolean {
    for (const [, serviceStatus] of this.services) {
      for (const [, taskStatus] of serviceStatus.tasks) {
        if (taskStatus.state === 'failed' || (taskStatus.state === 'done' && !taskStatus.result?.success)) {
          return false;
        }
      }
    }
    return true;
  }
}
