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
  private taskNames: Record<string, string>;

  constructor(taskNames?: Record<string, string>) {
    super();
    this.taskNames = taskNames || {};
  }

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
    console.log(`${COLORS.BLUE}║       Services Linting (${this.services.size} services)${' '.repeat(Math.max(0, 28 - this.services.size.toString().length))}║${COLORS.NC}`);
    console.log(`${COLORS.BLUE}╚═══════════════════════════════════════════════════════════╝${COLORS.NC}`);
    console.log('');

    // Services and tasks
    for (const [serviceName, serviceStatus] of this.services) {
      console.log(`${COLORS.CYAN}${serviceName}${COLORS.NC}`);

      const tasks = Array.from(serviceStatus.tasks.entries());
      // Display tasks in single column
      for (const [taskId, taskStatus] of tasks) {
        const taskDisplay = this.formatTask(taskId, taskStatus);
        console.log(`  ${taskDisplay}`);
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
    console.log(`${COLORS.BLUE}║                Linting Complete                          ║${COLORS.NC}`);
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
    console.log(`${COLORS.CYAN}Results: ${stats.passedServices} passed, ${stats.failedServices} failed out of ${stats.totalServices} service(s)${COLORS.NC}`);

    if (stats.failedServices === 0) {
      console.log('');
      console.log(`${COLORS.GREEN}✓ All linting checks passed!${COLORS.NC}`);
    } else {
      console.log('');
      console.log(`${COLORS.RED}✗ Some linting checks failed${COLORS.NC}`);
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
    return this.taskNames[taskId] || taskId;
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
