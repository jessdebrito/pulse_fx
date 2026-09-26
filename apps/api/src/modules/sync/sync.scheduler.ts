import cron from 'node-cron';
import type { AppLogger } from '../../shared/logger';
import { SyncInProgressError } from './sync.errors';
import type { SyncRunner } from './sync.service';

export type ScheduleFunction = (expression: string, task: () => Promise<void>, timeZone: string) => unknown;

export interface ScheduledSync {
  run(): Promise<object>;
}

export interface SyncSchedulerOptions {
  readonly expressions: readonly string[];
  readonly timeZone: string;
  readonly service: ScheduledSync;
  readonly logger: AppLogger;
  readonly schedule?: ScheduleFunction;
}

const scheduleWithNodeCron: ScheduleFunction = (expression, task, timeZone) => cron.schedule(expression, task, { timezone: timeZone });

export function startSyncScheduler(options: SyncSchedulerOptions): void {
  const schedule = options.schedule ?? scheduleWithNodeCron;
  for (const expression of options.expressions) {
    schedule(expression, () => runScheduledSync(options.service, options.logger), options.timeZone);
  }
}

export async function runScheduledSync(service: ScheduledSync, logger: AppLogger): Promise<void> {
  try {
    const report = await service.run();
    logger.info({ report }, 'Scheduled sync finished');
  } catch (error) {
    if (error instanceof SyncInProgressError) {
      logger.warn({}, 'Scheduled sync skipped because another sync is in progress');
      return;
    }
    logger.error({ err: error }, 'Scheduled sync failed');
  }
}

export async function runInitialLoad(service: SyncRunner, logger: AppLogger): Promise<void> {
  try {
    const report = await service.runInitialLoad();
    if (report === null) {
      logger.info({}, 'Initial load skipped: quotes already stored');
      return;
    }
    logger.info({ report }, 'Initial load finished');
  } catch (error) {
    logger.error({ err: error }, 'Initial load failed');
  }
}
