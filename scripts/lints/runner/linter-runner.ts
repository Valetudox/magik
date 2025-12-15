import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import type { LintTask, Reporter, ServiceStatus, TaskStatus, TaskResult } from '../types';

export interface LinterConfig {
  serviceType: 'backend' | 'frontend';
  servicePrefix: string; // e.g., 'backend-' or 'ui-'
  createTasks: (service: string, rootDir: string) => LintTask[];
}

export class LinterRunner {
  private rootDir: string;
  private reporter: Reporter;
  private config: LinterConfig;
  private services: Map<string, ServiceStatus> = new Map();
  private targetServices?: string[];

  constructor(rootDir: string, reporter: Reporter, config: LinterConfig, targetServices?: string[]) {
    this.rootDir = rootDir;
    this.reporter = reporter;
    this.config = config;
    this.targetServices = targetServices;
  }

  async run(): Promise<boolean> {
    // Discover services
    const allServices = this.discoverServices();

    // Filter services if specific ones were requested
    const services = this.targetServices
      ? allServices.filter(s => this.targetServices!.includes(s))
      : allServices;

    // Validate requested services exist
    if (this.targetServices && this.targetServices.length > 0) {
      const invalidServices = this.targetServices.filter(s => !allServices.includes(s));
      if (invalidServices.length > 0) {
        console.error(`Error: Invalid service(s): ${invalidServices.join(', ')}`);
        console.error(`Available services: ${allServices.join(', ')}`);
        return false;
      }
    }

    if (services.length === 0) {
      console.log(`No ${this.config.serviceType} services found`);
      return true;
    }

    // Initialize service statuses
    for (const service of services) {
      const tasks = this.config.createTasks(service, this.rootDir);
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

    // Run linting for all services concurrently
    await Promise.all(
      services.map(service => this.runServiceLinting(service))
    );

    // Notify completion
    this.reporter.onComplete(this.services);

    // Check if all services passed
    return this.allServicesPassed();
  }

  getServices(): string[] {
    return this.discoverServices();
  }

  private discoverServices(): string[] {
    const appsDir = join(this.rootDir, 'apps');
    const services: string[] = [];

    try {
      const entries = readdirSync(appsDir);

      for (const entry of entries) {
        if (entry.startsWith(this.config.servicePrefix)) {
          const fullPath = join(appsDir, entry);
          if (statSync(fullPath).isDirectory()) {
            services.push(entry);
          }
        }
      }
    } catch (error) {
      console.error(`Error discovering ${this.config.serviceType} services:`, error);
    }

    return services.sort();
  }

  private async runServiceLinting(service: string): Promise<void> {
    const tasks = this.config.createTasks(service, this.rootDir);

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
