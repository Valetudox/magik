import type { Reporter, ProgressEvent, E2EProjectStatus, TaskStatus, SummaryStats } from '../types';

const COLORS = {
  RED: '\x1b[0;31m',
  GREEN: '\x1b[0;32m',
  YELLOW: '\x1b[1;33m',
  BLUE: '\x1b[0;34m',
  CYAN: '\x1b[0;36m',
  NC: '\x1b[0m',
};

export class CLIReporter implements Reporter {
  private projects: Map<string, E2EProjectStatus> = new Map();
  private isCompleted = false;
  private taskNames: Record<string, string>;

  constructor(taskNames?: Record<string, string>) {
    this.taskNames = taskNames || {};
  }

  onProgress(event: ProgressEvent): void {
    if (this.isCompleted) return;

    // Update internal state
    if (event.allProjects) {
      this.projects = new Map(event.allProjects);
    }

    // Render the full display
    this.render();
  }

  onComplete(projects: Map<string, E2EProjectStatus>): void {
    this.projects = projects;
    this.isCompleted = true;
    this.renderFinal();
  }

  private render(): void {
    // Clear screen and move cursor to top
    process.stdout.write('\x1b[2J\x1b[H');

    const stats = this.calculateStats(this.projects);
    const progressPercent = stats.totalTasks > 0
      ? Math.floor((stats.passedTasks + stats.failedTasks) / stats.totalTasks * 100)
      : 0;
    const completedTasks = stats.passedTasks + stats.failedTasks;

    // Header
    console.log(`${COLORS.BLUE}╔═══════════════════════════════════════════════════════════╗${COLORS.NC}`);
    console.log(`${COLORS.BLUE}║       E2E Tests (${this.projects.size} projects)${' '.repeat(Math.max(0, 34 - this.projects.size.toString().length))}║${COLORS.NC}`);
    console.log(`${COLORS.BLUE}╚═══════════════════════════════════════════════════════════╝${COLORS.NC}`);
    console.log('');

    // Projects and tasks
    for (const [projectName, projectStatus] of this.projects) {
      console.log(`${COLORS.CYAN}TEST ${projectName}${COLORS.NC}`);

      const tasks = Array.from(projectStatus.tasks.entries());
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

    const stats = this.calculateStats(this.projects);

    // Header
    console.log(`${COLORS.BLUE}╔═══════════════════════════════════════════════════════════╗${COLORS.NC}`);
    console.log(`${COLORS.BLUE}║                E2E Tests Complete                        ║${COLORS.NC}`);
    console.log(`${COLORS.BLUE}╚═══════════════════════════════════════════════════════════╝${COLORS.NC}`);
    console.log('');

    // Projects and tasks
    for (const [projectName, projectStatus] of this.projects) {
      const projectFailed = this.isProjectFailed(projectStatus);
      const prefix = projectFailed ? `${COLORS.RED}✖${COLORS.NC}` : `${COLORS.GREEN}✔${COLORS.NC}`;

      console.log(`${prefix} ${COLORS.CYAN}${projectName}${COLORS.NC}`);

      const tasks = Array.from(projectStatus.tasks.entries());
      for (const [taskId, taskStatus] of tasks) {
        const taskDisplay = this.formatTask(taskId, taskStatus);
        console.log(`  ${taskDisplay}`);
      }
      console.log('');
    }

    // Summary
    const allPassed = stats.failedProjects === 0;
    const summaryColor = allPassed ? COLORS.GREEN : COLORS.RED;
    const summaryStatus = allPassed ? '✔ All tests passed!' : '✖ Some tests failed';

    console.log(`${COLORS.BLUE}═══════════════════════════════════════════════════════════${COLORS.NC}`);
    console.log(`${summaryColor}${summaryStatus}${COLORS.NC}`);
    console.log(`Projects: ${stats.passedProjects}/${stats.totalProjects} passed`);
    console.log(`Tasks: ${stats.passedTasks}/${stats.totalTasks} passed`);
    console.log('');
  }

  private formatTask(taskId: string, status: TaskStatus): string {
    const taskName = this.taskNames[taskId] || taskId;

    let icon = '○';
    let color = COLORS.NC;
    let duration = '';

    if (status.state === 'in_progress') {
      icon = '◐';
      color = COLORS.YELLOW;
    } else if (status.state === 'done') {
      icon = status.result?.success ? '✔' : '✖';
      color = status.result?.success ? COLORS.GREEN : COLORS.RED;
      if (status.startTime && status.endTime) {
        const durationMs = status.endTime - status.startTime;
        duration = ` (${(durationMs / 1000).toFixed(1)}s)`;
      }
    } else if (status.state === 'failed') {
      icon = '✖';
      color = COLORS.RED;
    }

    return `${color}${icon}${COLORS.NC} ${taskName}${duration}`;
  }

  private calculateStats(projects: Map<string, E2EProjectStatus>): SummaryStats {
    let totalProjects = 0;
    let totalTasks = 0;
    let passedProjects = 0;
    let failedProjects = 0;
    let passedTasks = 0;
    let failedTasks = 0;

    for (const [, projectStatus] of projects) {
      totalProjects++;
      let projectHasFailed = false;

      for (const [, taskStatus] of projectStatus.tasks) {
        totalTasks++;

        if (taskStatus.state === 'done' && taskStatus.result?.success) {
          passedTasks++;
        } else if (taskStatus.state === 'failed' || (taskStatus.state === 'done' && !taskStatus.result?.success)) {
          failedTasks++;
          projectHasFailed = true;
        }
      }

      if (projectHasFailed) {
        failedProjects++;
      } else {
        passedProjects++;
      }
    }

    return {
      totalProjects,
      totalTasks,
      passedProjects,
      failedProjects,
      passedTasks,
      failedTasks,
    };
  }

  private isProjectFailed(projectStatus: E2EProjectStatus): boolean {
    for (const [, taskStatus] of projectStatus.tasks) {
      if (taskStatus.state === 'failed' || (taskStatus.state === 'done' && !taskStatus.result?.success)) {
        return true;
      }
    }
    return false;
  }
}
