import { BaseReporter } from './base-reporter';
import type { ProgressEvent, ServiceStatus, TaskStatus } from '../types';

const COLORS = {
  RED: '\x1b[0;31m',
  GREEN: '\x1b[0;32m',
  YELLOW: '\x1b[1;33m',
  BLUE: '\x1b[0;34m',
  CYAN: '\x1b[0;36m',
  NC: '\x1b[0m',
};

export class CLIReporter extends BaseReporter {
  private services: Map<string, ServiceStatus> = new Map();
  private isCompleted = false;

  onProgress(event: ProgressEvent): void {
    if (this.isCompleted) return;

    // Update internal state
    if (event.allServices) {
      this.services = new Map(event.allServices);
    }

    // Render the full display
    this.render();
  }

  onComplete(services: Map<string, ServiceStatus>): void {
    this.services = services;
    this.isCompleted = true;
    this.renderFinal();
  }

  private render(): void {
    // Clear screen and move cursor to top
    process.stdout.write('\x1b[2J\x1b[H');

    const stats = this.calculateStats(this.services);
    const progressPercent = stats.totalTasks > 0
      ? Math.floor((stats.passedTasks + stats.failedTasks) / stats.totalTasks * 100)
      : 0;
    const completedTasks = stats.passedTasks + stats.failedTasks;

    // Header
    console.log(`${COLORS.BLUE}╔═══════════════════════════════════════════════════════════╗${COLORS.NC}`);
    console.log(`${COLORS.BLUE}║    Backend Services Linting (${this.services.size} services)${' '.repeat(Math.max(0, 23 - this.services.size.toString().length))}║${COLORS.NC}`);
    console.log(`${COLORS.BLUE}╚═══════════════════════════════════════════════════════════╝${COLORS.NC}`);
    console.log('');

    // Services and tasks
    for (const [serviceName, serviceStatus] of this.services) {
      console.log(`${COLORS.CYAN}${serviceName}${COLORS.NC}`);

      const tasks = Array.from(serviceStatus.tasks.entries());
      // Display tasks in two columns
      for (let i = 0; i < tasks.length; i += 2) {
        const [taskId1, taskStatus1] = tasks[i];
        const task1Display = this.formatTask(taskId1, taskStatus1);

        if (i + 1 < tasks.length) {
          const [taskId2, taskStatus2] = tasks[i + 1];
          const task2Display = this.formatTask(taskId2, taskStatus2);
          console.log(`  ${task1Display}${' '.repeat(Math.max(0, 35 - this.stripAnsi(task1Display).length))}${task2Display}`);
        } else {
          console.log(`  ${task1Display}`);
        }
      }
      console.log('');
    }

    // Progress bar
    const barWidth = 40;
    const filledWidth = Math.floor(barWidth * progressPercent / 100);
    const emptyWidth = barWidth - filledWidth;
    const bar = '█'.repeat(filledWidth) + '░'.repeat(emptyWidth);

    console.log(`Progress: [${bar}] ${progressPercent}% (${completedTasks}/${stats.totalTasks} tasks)`);
  }

  private renderFinal(): void {
    // Clear screen and move cursor to top
    process.stdout.write('\x1b[2J\x1b[H');

    const stats = this.calculateStats(this.services);

    // Header
    console.log(`${COLORS.BLUE}╔═══════════════════════════════════════════════════════════╗${COLORS.NC}`);
    console.log(`${COLORS.BLUE}║              Backend Linting Complete                    ║${COLORS.NC}`);
    console.log(`${COLORS.BLUE}╚═══════════════════════════════════════════════════════════╝${COLORS.NC}`);
    console.log('');

    // Services and tasks
    for (const [serviceName, serviceStatus] of this.services) {
      const serviceFailed = this.isServiceFailed(serviceStatus);
      const serviceIcon = serviceFailed ? `${COLORS.RED}✗${COLORS.NC}` : `${COLORS.GREEN}✓${COLORS.NC}`;

      console.log(`${serviceIcon} ${COLORS.CYAN}${serviceName}${COLORS.NC}`);

      for (const [taskId, taskStatus] of serviceStatus.tasks) {
        const taskDisplay = this.formatTask(taskId, taskStatus);
        console.log(`    ${taskDisplay}`);
      }
      console.log('');
    }

    // Final summary
    console.log(`${COLORS.BLUE}========================================${COLORS.NC}`);
    console.log(`${COLORS.BLUE}  Final Summary${COLORS.NC}`);
    console.log(`${COLORS.BLUE}========================================${COLORS.NC}`);
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

  private formatTask(taskId: string, taskStatus: TaskStatus): string {
    const taskName = this.getTaskDisplayName(taskId);
    const icon = this.getStatusIcon(taskStatus);
    return `${icon} ${taskName}`;
  }

  private getStatusIcon(taskStatus: TaskStatus): string {
    switch (taskStatus.state) {
      case 'waiting':
        return '⏳';
      case 'in_progress':
        return '⏱️ ';
      case 'done':
        return taskStatus.result?.success ? `${COLORS.GREEN}✅${COLORS.NC}` : `${COLORS.RED}❌${COLORS.NC}`;
      case 'failed':
        return `${COLORS.RED}❌${COLORS.NC}`;
      default:
        return '⏳';
    }
  }

  private getTaskDisplayName(taskId: string): string {
    const taskNames: Record<string, string> = {
      eslint: 'ESLint',
      structure: 'Structure validation',
      config: 'Config extends',
      routes: 'Route-action alignment',
    };
    return taskNames[taskId] || taskId;
  }

  private isServiceFailed(serviceStatus: ServiceStatus): boolean {
    for (const [, taskStatus] of serviceStatus.tasks) {
      if (taskStatus.state === 'failed' || (taskStatus.state === 'done' && !taskStatus.result?.success)) {
        return true;
      }
    }
    return false;
  }

  private stripAnsi(str: string): string {
    return str.replace(/\x1b\[[0-9;]*m/g, '');
  }
}
