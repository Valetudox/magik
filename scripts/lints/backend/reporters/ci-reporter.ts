import { BaseReporter } from './base-reporter';
import type { ProgressEvent, ServiceStatus } from '../types';

const COLORS = {
  RED: '\x1b[0;31m',
  GREEN: '\x1b[0;32m',
  YELLOW: '\x1b[1;33m',
  BLUE: '\x1b[0;34m',
  CYAN: '\x1b[0;36m',
  NC: '\x1b[0m',
};

export class CIReporter extends BaseReporter {
  private currentService: string | null = null;
  private serviceTaskCount: number = 0;
  private totalTasks: number = 4; // ESLint, Structure, Config, Routes

  onProgress(event: ProgressEvent): void {
    const timestamp = new Date().toISOString();

    switch (event.type) {
      case 'service_started':
        if (event.service) {
          this.currentService = event.service;
          this.serviceTaskCount = 0;
          console.log(`${COLORS.BLUE}========================================${COLORS.NC}`);
          console.log(`${COLORS.BLUE}Service: ${event.service}${COLORS.NC}`);
          console.log(`${COLORS.BLUE}========================================${COLORS.NC}`);
          console.log('');
        }
        break;

      case 'task_started':
        if (event.taskId && event.service) {
          this.serviceTaskCount++;
          const taskName = this.getTaskDisplayName(event.taskId);
          console.log(`${COLORS.YELLOW}  [${this.serviceTaskCount}/${this.totalTasks}] Running ${taskName}...${COLORS.NC}`);
        }
        break;

      case 'task_completed':
        if (event.taskId && event.status) {
          const success = event.status.state === 'done' && event.status.result?.success;
          const taskName = this.getTaskDisplayName(event.taskId);

          if (success) {
            console.log(`${COLORS.GREEN}  ✓ ${taskName} passed${COLORS.NC}`);
          } else {
            console.log(`${COLORS.RED}  ✗ ${taskName} failed${COLORS.NC}`);
            if (event.status.result?.error) {
              console.error(event.status.result.error);
            }
          }
          console.log('');
        }
        break;

      case 'service_completed':
        if (event.service && event.allServices) {
          const serviceStatus = event.allServices.get(event.service);
          if (serviceStatus) {
            const serviceFailed = this.isServiceFailed(serviceStatus);
            if (serviceFailed) {
              console.log(`${COLORS.RED}✗ ${event.service}: Some checks failed${COLORS.NC}`);
            } else {
              console.log(`${COLORS.GREEN}✓ ${event.service}: All checks passed${COLORS.NC}`);
            }
            console.log('');
          }
        }
        break;
    }
  }

  onComplete(services: Map<string, ServiceStatus>): void {
    const stats = this.calculateStats(services);

    console.log(`${COLORS.BLUE}========================================${COLORS.NC}`);
    console.log(`${COLORS.BLUE}  Final Summary${COLORS.NC}`);
    console.log(`${COLORS.BLUE}========================================${COLORS.NC}`);
    console.log('');

    for (const [serviceName, serviceStatus] of services) {
      const serviceFailed = this.isServiceFailed(serviceStatus);

      if (serviceFailed) {
        console.log(`${COLORS.RED}✗ ${serviceName}${COLORS.NC}`);

        // Show which linters failed
        for (const [taskId, taskStatus] of serviceStatus.tasks) {
          const taskFailed = taskStatus.state === 'failed' ||
                            (taskStatus.state === 'done' && !taskStatus.result?.success);
          if (taskFailed) {
            const taskName = this.getTaskDisplayName(taskId);
            console.log(`    - ${taskName} failed`);
          }
        }
      } else {
        console.log(`${COLORS.GREEN}✓ ${serviceName}${COLORS.NC}`);
      }
    }

    console.log('');
    console.log(`${COLORS.CYAN}Results: ${stats.passedServices} passed, ${stats.failedServices} failed out of ${stats.totalServices} backend(s)${COLORS.NC}`);

    if (stats.failedServices === 0) {
      console.log('');
      console.log(`${COLORS.GREEN}✓ All backend linting checks passed!${COLORS.NC}`);
    } else {
      console.log('');
      console.log(`${COLORS.RED}✗ Some backend linting checks failed${COLORS.NC}`);
    }
  }

  private isServiceFailed(serviceStatus: ServiceStatus): boolean {
    for (const [, taskStatus] of serviceStatus.tasks) {
      if (taskStatus.state === 'failed' || (taskStatus.state === 'done' && !taskStatus.result?.success)) {
        return true;
      }
    }
    return false;
  }

  private getTaskDisplayName(taskId: string): string {
    const taskNames: Record<string, string> = {
      eslint: 'ESLint',
      structure: 'Structure validation',
      config: 'Config extends validation',
      routes: 'Route-action alignment',
    };
    return taskNames[taskId] || taskId;
  }
}
