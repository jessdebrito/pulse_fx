import type { IndicatorKey } from '../../../../src/modules/indicators';
import { IndicatorSyncService } from '../../../../src/modules/sync/indicator-sync.service';
import { BcbSgsClient } from '../../../../src/modules/sync/sources/bcb-sgs.client';
import { FredClient } from '../../../../src/modules/sync/sources/fred.client';
import { ExternalSourceError, SyncInProgressError } from '../../../../src/modules/sync/sync.errors';
import type { IndicatorSyncState } from '../../../../src/modules/sync/sync.types';
import { CalendarDate } from '../../../../src/shared/calendar-date';
import type { Clock } from '../../../../src/shared/clock';
import { InMemoryIndicatorObservationRepository, InMemoryIndicatorRepository } from '../../../support/in-memory/indicators';
import { InMemoryIndicatorSyncStateRepository, InMemorySyncLock } from '../../../support/in-memory/sync';
import { RecordedSgsHttpClient, type SgsRecordings } from '../../../support/sources/bcb-sgs/recorded-sgs-http-client';
import { RecordedFredHttpClient, TEST_FRED_API_KEY, type FredRecordings } from '../../../support/sources/fred/recorded-fred-http-client';

const THURSDAY_AFTER_CLOSING = new Date('2026-09-24T16:15:00Z');
const US_IMPORTS_FROM_BRAZIL: IndicatorKey = { source: 'fred', code: 'IMP3510' };
const BRAZIL_COMMODITIES_INDEX: IndicatorKey = { source: 'sgs', code: '27574' };
const TRACKED = [US_IMPORTS_FROM_BRAZIL, BRAZIL_COMMODITIES_INDEX];

interface Recordings {
  readonly fred?: FredRecordings;
  readonly sgs?: SgsRecordings;
}

const clock: Clock = { now: () => THURSDAY_AFTER_CLOSING, today: () => CalendarDate.fromIso('2026-09-24') };

function setup(recordings: Recordings): {
  service: IndicatorSyncService;
  fredHttp: RecordedFredHttpClient;
  sgsHttp: RecordedSgsHttpClient;
  indicators: InMemoryIndicatorRepository;
  observations: InMemoryIndicatorObservationRepository;
  syncStates: InMemoryIndicatorSyncStateRepository;
  lock: InMemorySyncLock;
} {
  const fredHttp = new RecordedFredHttpClient({ series: true, ...recordings.fred });
  const sgsHttp = new RecordedSgsHttpClient({ metadata: true, ...recordings.sgs });
  const indicators = new InMemoryIndicatorRepository();
  const observations = new InMemoryIndicatorObservationRepository();
  const syncStates = new InMemoryIndicatorSyncStateRepository();
  const lock = new InMemorySyncLock();
  const service = new IndicatorSyncService({
    trackedIndicators: TRACKED,
    sources: { fred: new FredClient(fredHttp, TEST_FRED_API_KEY), sgs: new BcbSgsClient(sgsHttp) },
    indicators,
    observations,
    syncStates,
    lock,
    clock,
  });
  return { service, fredHttp, sgsHttp, indicators, observations, syncStates, lock };
}

function syncedState(key: IndicatorKey, lastObservationDate: string): IndicatorSyncState {
  return {
    ...key,
    lastAttemptAt: THURSDAY_AFTER_CLOSING,
    lastSuccessAt: THURSDAY_AFTER_CLOSING,
    lastStatus: 'success',
    lastError: null,
    lastObservationDate: CalendarDate.fromIso(lastObservationDate),
  };
}

function periodOf(url: URL | undefined, startParameter: string, endParameter: string): string {
  return `${url?.searchParams.get(startParameter) ?? ''}..${url?.searchParams.get(endParameter) ?? ''}`;
}

const NO_NEW_DATA: Recordings = { fred: { periods: ['2026-09-23-to-2026-09-24'] }, sgs: { periods: ['2026-09-23-to-2026-09-24'] } };
const SINCE_JUNE: Recordings = { fred: { periods: ['2026-06-01-to-2026-09-24'] }, sgs: { periods: ['2026-06-01-to-2026-09-24'] } };

describe('IndicatorSyncService.run', () => {
  it('should store every tracked indicator with the name, unit and frequency published by its source', async () => {
    const { service, indicators } = setup(NO_NEW_DATA);

    await service.run();

    expect(indicators.find(US_IMPORTS_FROM_BRAZIL)).toEqual({
      source: 'fred',
      code: 'IMP3510',
      name: 'U.S. Imports of Goods by Customs Basis from Brazil',
      unit: 'Millions of Dollars',
      frequency: 'monthly',
    });
    expect(indicators.find(BRAZIL_COMMODITIES_INDEX)).toEqual({
      source: 'sgs',
      code: '27574',
      name: 'Índice de Commodities - Brasil',
      unit: 'Índice',
      frequency: 'monthly',
    });
  });

  it('should request yesterday and today and record success without observations when the indicator was never synced', async () => {
    const { service, fredHttp, sgsHttp, syncStates } = setup(NO_NEW_DATA);

    const report = await service.run();

    expect(periodOf(fredHttp.observationUrlsFor('IMP3510')[0], 'observation_start', 'observation_end')).toBe('2026-09-23..2026-09-24');
    expect(periodOf(sgsHttp.observationUrlsFor('27574')[0], 'dataInicial', 'dataFinal')).toBe('23/09/2026..24/09/2026');
    expect(report.results).toEqual([
      { source: 'fred', code: 'IMP3510', status: 'synced', upserted: 0 },
      { source: 'sgs', code: '27574', status: 'synced', upserted: 0 },
    ]);
    expect(syncStates.find(US_IMPORTS_FROM_BRAZIL)).toMatchObject({ lastStatus: 'success', lastSuccessAt: THURSDAY_AFTER_CLOSING, lastObservationDate: null });
  });

  it('should start from the last stored observation date and store the new observations when the indicator already has data', async () => {
    const { service, observations, syncStates } = setup(SINCE_JUNE);
    await syncStates.save(syncedState(US_IMPORTS_FROM_BRAZIL, '2026-06-01'));
    await syncStates.save(syncedState(BRAZIL_COMMODITIES_INDEX, '2026-06-01'));

    const report = await service.run();

    expect(report.results).toEqual([
      { source: 'fred', code: 'IMP3510', status: 'synced', upserted: 2 },
      { source: 'sgs', code: '27574', status: 'synced', upserted: 3 },
    ]);
    expect(observations.observationsOf(BRAZIL_COMMODITIES_INDEX).map((observation) => `${observation.date.toString()} ${observation.value}`)).toEqual([
      '2026-06-01 442.88',
      '2026-07-01 440.36',
      '2026-08-01 456.24',
    ]);
    expect(syncStates.find(US_IMPORTS_FROM_BRAZIL)?.lastObservationDate?.toString()).toBe('2026-07-01');
    expect(syncStates.find(BRAZIL_COMMODITIES_INDEX)?.lastObservationDate?.toString()).toBe('2026-08-01');
  });

  it('should record the failure and continue with the next indicator when a source request fails', async () => {
    const { service, syncStates } = setup({ ...NO_NEW_DATA, fred: { periods: ['2026-09-23-to-2026-09-24'], failures: { IMP3510: new ExternalSourceError('FRED timeout') } } });

    const report = await service.run();

    expect(report.results).toEqual([
      { source: 'fred', code: 'IMP3510', status: 'failed', upserted: 0, error: 'FRED timeout' },
      { source: 'sgs', code: '27574', status: 'synced', upserted: 0 },
    ]);
    expect(syncStates.find(US_IMPORTS_FROM_BRAZIL)).toMatchObject({ lastStatus: 'failure', lastError: 'FRED timeout', lastAttemptAt: THURSDAY_AFTER_CLOSING, lastSuccessAt: null });
  });

  it('should stamp the report with the clock time when the run finishes', async () => {
    const { service } = setup(NO_NEW_DATA);

    const report = await service.run();

    expect(report.startedAt).toBe(THURSDAY_AFTER_CLOSING.toISOString());
    expect(report.finishedAt).toBe(THURSDAY_AFTER_CLOSING.toISOString());
  });

  it('should throw SyncInProgressError when another indicator sync holds the lock', async () => {
    const { service, lock } = setup(NO_NEW_DATA);
    lock.isHeldElsewhere = true;

    await expect(service.run()).rejects.toThrow(SyncInProgressError);
  });
});

describe('IndicatorSyncService.backfill', () => {
  const FROM = CalendarDate.fromIso('2024-01-01');
  const TO = CalendarDate.fromIso('2026-09-24');
  const FULL_HISTORY: Recordings = { fred: { periods: ['2024-01-01-to-2026-09-24'] }, sgs: { periods: ['2024-01-01-to-2026-09-24'] } };
  const YEAR_2024: Recordings = { fred: { periods: ['2024-01-01-to-2024-12-31'] }, sgs: { periods: ['2024-01-01-to-2024-12-31'] } };

  it('should fetch the whole range in one request per indicator and store every real observation', async () => {
    const { service, fredHttp, sgsHttp, observations } = setup(FULL_HISTORY);

    const report = await service.backfill(FROM, TO);

    expect(fredHttp.observationUrlsFor('IMP3510')).toHaveLength(1);
    expect(sgsHttp.observationUrlsFor('27574')).toHaveLength(1);
    expect(report).toMatchObject({ from: '2024-01-01', to: '2026-09-24' });
    expect(report.results).toEqual([
      { source: 'fred', code: 'IMP3510', status: 'synced', upserted: 31 },
      { source: 'sgs', code: '27574', status: 'synced', upserted: 32 },
    ]);
    expect(observations.observationsOf(US_IMPORTS_FROM_BRAZIL)[0]).toEqual({ date: CalendarDate.fromIso('2024-01-01'), value: '3759.060245' });
  });

  it('should set the last observation date when the indicator had no data', async () => {
    const { service, syncStates } = setup(YEAR_2024);

    await service.backfill(FROM, CalendarDate.fromIso('2024-12-31'));

    expect(syncStates.find(BRAZIL_COMMODITIES_INDEX)).toMatchObject({ lastStatus: 'success', lastObservationDate: CalendarDate.fromIso('2024-12-01') });
  });

  it('should keep the most recent observation date when backfilling older data', async () => {
    const { service, syncStates } = setup(YEAR_2024);
    await syncStates.save(syncedState(BRAZIL_COMMODITIES_INDEX, '2026-08-01'));

    await service.backfill(FROM, CalendarDate.fromIso('2024-12-31'));

    expect(syncStates.find(BRAZIL_COMMODITIES_INDEX)?.lastObservationDate?.toString()).toBe('2026-08-01');
  });

  it('should throw SyncInProgressError when another indicator sync holds the lock', async () => {
    const { service, lock } = setup(FULL_HISTORY);
    lock.isHeldElsewhere = true;

    await expect(service.backfill(FROM, TO)).rejects.toThrow(SyncInProgressError);
  });
});
