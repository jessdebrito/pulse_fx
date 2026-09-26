import type { CalendarDate } from '../../shared/calendar-date';
import type { Clock } from '../../shared/clock';
import type { IndicatorKey, IndicatorObservation, IndicatorObservationRepository, IndicatorRepository, IndicatorSource } from '../indicators';
import type { IndicatorSourceClient } from './sources/indicator-source.client';
import type { IndicatorSyncStateRepository } from './indicator-sync-state.repository';
import type { SyncLock } from './sync-lock.repository';
import { initialIndicatorSyncState, syncStartDate } from './sync-policy.rules';
import type { CalendarRange, IndicatorBackfillReportDto, IndicatorSyncReportDto, IndicatorSyncResultDto, IndicatorSyncState } from './sync.types';

export interface IndicatorSyncRunner {
  run(): Promise<IndicatorSyncReportDto>;
  backfill(from: CalendarDate, to: CalendarDate): Promise<IndicatorBackfillReportDto>;
}

export type IndicatorSourceClients = Readonly<Record<IndicatorSource, IndicatorSourceClient>>;

export interface IndicatorSyncServiceDependencies {
  readonly trackedIndicators: readonly IndicatorKey[];
  readonly sources: IndicatorSourceClients;
  readonly indicators: IndicatorRepository;
  readonly observations: IndicatorObservationRepository;
  readonly syncStates: IndicatorSyncStateRepository;
  readonly lock: SyncLock;
  readonly clock: Clock;
}

type RangeFor = (state: IndicatorSyncState, today: CalendarDate) => CalendarRange;

export class IndicatorSyncService implements IndicatorSyncRunner {
  constructor(private readonly dependencies: IndicatorSyncServiceDependencies) {}

  run(): Promise<IndicatorSyncReportDto> {
    return this.dependencies.lock.withLock(() => this.syncAll());
  }

  backfill(from: CalendarDate, to: CalendarDate): Promise<IndicatorBackfillReportDto> {
    return this.dependencies.lock.withLock(() => this.backfillAll(from, to));
  }

  private async syncAll(): Promise<IndicatorSyncReportDto> {
    const startedAt = this.dependencies.clock.now().toISOString();
    const results = await this.syncEveryIndicator((state, today) => ({ from: syncStartDate(state, today), to: today }));
    return { startedAt, finishedAt: this.dependencies.clock.now().toISOString(), results };
  }

  private async backfillAll(from: CalendarDate, to: CalendarDate): Promise<IndicatorBackfillReportDto> {
    const startedAt = this.dependencies.clock.now().toISOString();
    const results = await this.syncEveryIndicator(() => ({ from, to }));
    return { startedAt, finishedAt: this.dependencies.clock.now().toISOString(), from: from.toString(), to: to.toString(), results };
  }

  private async syncEveryIndicator(rangeFor: RangeFor): Promise<IndicatorSyncResultDto[]> {
    const results: IndicatorSyncResultDto[] = [];
    for (const key of this.dependencies.trackedIndicators) {
      results.push(await this.syncIndicator(key, rangeFor));
    }
    return results;
  }

  private async syncIndicator(key: IndicatorKey, rangeFor: RangeFor): Promise<IndicatorSyncResultDto> {
    const state = (await this.dependencies.syncStates.findByIndicator(key)) ?? initialIndicatorSyncState(key);
    const now = this.dependencies.clock.now();
    try {
      const source = this.dependencies.sources[key.source];
      await this.dependencies.indicators.upsert(await source.fetchIndicator(key.code));
      const range = rangeFor(state, this.dependencies.clock.today());
      const observations = await source.fetchObservations(key.code, range.from, range.to);
      const upserted = await this.dependencies.observations.upsertMany(key, observations);
      await this.dependencies.syncStates.save(succeededState(state, now, observations));
      return { source: key.source, code: key.code, status: 'synced', upserted };
    } catch (error) {
      const message = errorMessage(error);
      await this.dependencies.syncStates.save({ ...state, lastAttemptAt: now, lastStatus: 'failure', lastError: message });
      return { source: key.source, code: key.code, status: 'failed', upserted: 0, error: message };
    }
  }
}

function succeededState(state: IndicatorSyncState, now: Date, observations: readonly IndicatorObservation[]): IndicatorSyncState {
  const lastObservationDate = observations.reduce(
    (latest, observation) => (latest === null || latest.isBefore(observation.date) ? observation.date : latest),
    state.lastObservationDate,
  );
  return { ...state, lastAttemptAt: now, lastSuccessAt: now, lastStatus: 'success', lastError: null, lastObservationDate };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
