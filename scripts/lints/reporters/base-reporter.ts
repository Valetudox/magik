import type { ProgressEvent, Reporter, ServiceStatus, TaskStatus } from '../types';

export abstract class BaseReporter implements Reporter {
  abstract onProgress(event: ProgressEvent): void;
  abstract onComplete(services: Map<string, ServiceStatus>): void;

  protected calculateStats(services: Map<string, ServiceStatus>) {
    let totalServices = services.size;
    let totalTasks = 0;
    let passedServices = 0;
    let failedServices = 0;
    let passedTasks = 0;
    let failedTasks = 0;

    for (const [, serviceStatus] of services) {
      let serviceFailed = false;

      for (const [, taskStatus] of serviceStatus.tasks) {
        totalTasks++;
        if (taskStatus.state === 'done' && taskStatus.result?.success) {
          passedTasks++;
        } else if (taskStatus.state === 'failed' || (taskStatus.state === 'done' && !taskStatus.result?.success)) {
          failedTasks++;
          serviceFailed = true;
        }
      }

      if (serviceFailed) {
        failedServices++;
      } else {
        passedServices++;
      }
    }

    return {
      totalServices,
      totalTasks,
      passedServices,
      failedServices,
      passedTasks,
      failedTasks,
    };
  }

  protected getTaskDuration(taskStatus: TaskStatus): number | undefined {
    if (taskStatus.startTime && taskStatus.endTime) {
      return taskStatus.endTime - taskStatus.startTime;
    }
    return taskStatus.result?.duration;
  }
}
