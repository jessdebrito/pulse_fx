import type { AppLogger } from '../../../../src/shared/logger';
import { SyncInProgressError } from '../../../../src/modules/sync/sync.errors';
import { runInitialLoad, runScheduledSync, startSyncScheduler, type ScheduleFunction } from '../../../../src/modules/sync/sync.scheduler';
import type { SyncRunner } from '../../../../src/modules/sync/sync.service';
import type { SyncReportDto } from '../../../../src/modules/sync/sync.types';

const REPORT: SyncReportDto = {
  startedAt: '2026-09-25T13:15:00.000Z',
  finishedAt: '2026-09-25T13:15:01.000Z',
  catalog: { status: 'synced', currencies: 10 },
  results: [],
};

interface LoggerSpies {
  readonly logger: AppLogger;
  readonly info: jest.Mock;
  readonly warn: jest.Mock;
  readonly error: jest.Mock;
}

function fakeLogger(): LoggerSpies {
  const info = jest.fn();
  const warn = jest.fn();
  const error = jest.fn();
  return { logger: { info, warn, error }, info, warn, error };
}

function fakeService(overrides: Partial<SyncRunner> = {}): SyncRunner {
  return { run: jest.fn().mockResolvedValue(REPORT), runInitialLoad: jest.fn().mockResolvedValue(REPORT), backfill: jest.fn().mockResolvedValue(REPORT), ...overrides };
}

describe('startSyncScheduler', () => {
  it('should schedule every expression in the given time zone and run the sync when a task fires', async () => {
    const run = jest.fn().mockResolvedValue(REPORT);
    const schedule = jest.fn<unknown, Parameters<ScheduleFunction>>();

    startSyncScheduler({
      expressions: ['15 10 * * 1-5', '15 13 * * 1-5'],
      timeZone: 'America/Sao_Paulo',
      service: fakeService({ run }),
      logger: fakeLogger().logger,
      schedule,
    });
    await schedule.mock.calls[1]?.[1]();

    expect(schedule.mock.calls.map(([expression, , timeZone]) => [expression, timeZone])).toEqual([
      ['15 10 * * 1-5', 'America/Sao_Paulo'],
      ['15 13 * * 1-5', 'America/Sao_Paulo'],
    ]);
    expect(run).toHaveBeenCalledTimes(1);
  });
});

describe('runScheduledSync', () => {
  it('should log the report when the sync succeeds', async () => {
    const { logger, info } = fakeLogger();

    await runScheduledSync(fakeService(), logger);

    expect(info).toHaveBeenCalledWith({ report: REPORT }, 'Scheduled sync finished');
  });

  it('should log a warning without throwing when another sync is in progress', async () => {
    const { logger, warn, error } = fakeLogger();
    const service = fakeService({ run: jest.fn().mockRejectedValue(new SyncInProgressError()) });

    await expect(runScheduledSync(service, logger)).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(error).not.toHaveBeenCalled();
  });

  it('should log an error without throwing when the sync fails unexpectedly', async () => {
    const { logger, error } = fakeLogger();
    const failure = new Error('database down');

    await expect(runScheduledSync(fakeService({ run: jest.fn().mockRejectedValue(failure) }), logger)).resolves.toBeUndefined();
    expect(error).toHaveBeenCalledWith({ err: failure }, 'Scheduled sync failed');
  });
});

describe('runInitialLoad', () => {
  it('should log the report when the initial load ran', async () => {
    const { logger, info } = fakeLogger();

    await runInitialLoad(fakeService(), logger);

    expect(info).toHaveBeenCalledWith({ report: REPORT }, 'Initial load finished');
  });

  it('should log that it was skipped when quotes already exist', async () => {
    const { logger, info } = fakeLogger();

    await runInitialLoad(fakeService({ runInitialLoad: jest.fn().mockResolvedValue(null) }), logger);

    expect(info).toHaveBeenCalledWith({}, 'Initial load skipped: quotes already stored');
  });

  it('should log an error without throwing when the initial load fails', async () => {
    const { logger, error } = fakeLogger();
    const failure = new Error('database down');

    await expect(runInitialLoad(fakeService({ runInitialLoad: jest.fn().mockRejectedValue(failure) }), logger)).resolves.toBeUndefined();
    expect(error).toHaveBeenCalledWith({ err: failure }, 'Initial load failed');
  });
});
