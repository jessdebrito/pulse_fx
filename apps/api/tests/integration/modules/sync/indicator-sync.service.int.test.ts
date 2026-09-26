import type { DatabaseClient } from '../../../../src/database/client';
import { PrismaIndicatorObservationRepository, PrismaIndicatorRepository } from '../../../../src/modules/indicators';
import { IndicatorSyncService } from '../../../../src/modules/sync/indicator-sync.service';
import { PrismaIndicatorSyncStateRepository } from '../../../../src/modules/sync/indicator-sync-state.repository';
import { BcbSgsClient } from '../../../../src/modules/sync/sources/bcb-sgs.client';
import { FredClient } from '../../../../src/modules/sync/sources/fred.client';
import { PgAdvisorySyncLock } from '../../../../src/modules/sync/sync-lock.repository';
import { INDICATOR_SYNC_ADVISORY_LOCK_KEY } from '../../../../src/modules/sync/sync.constants';
import { CalendarDate } from '../../../../src/shared/calendar-date';
import type { Clock } from '../../../../src/shared/clock';
import { connectTestDatabase, disconnectTestDatabase, resetTestDatabase } from '../../../support/database/test-database';
import { RecordedSgsHttpClient } from '../../../support/sources/bcb-sgs/recorded-sgs-http-client';
import { RecordedFredHttpClient, TEST_FRED_API_KEY } from '../../../support/sources/fred/recorded-fred-http-client';

const NOW = new Date('2026-09-24T16:15:00.000Z');

const fixedClock: Clock = {
  now: () => NOW,
  today: () => CalendarDate.fromIso('2026-09-24'),
};

describe('IndicatorSyncService with PostgreSQL', () => {
  let client: DatabaseClient;
  let service: IndicatorSyncService;

  beforeAll(() => {
    client = connectTestDatabase();
    service = new IndicatorSyncService({
      trackedIndicators: [
        { source: 'fred', code: 'IMP3510' },
        { source: 'fred', code: 'EPUTRADE' },
        { source: 'fred', code: 'B235RC1Q027SBEA' },
        { source: 'sgs', code: '27574' },
      ],
      sources: {
        fred: new FredClient(new RecordedFredHttpClient({ series: true, periods: ['2024-01-01-to-2026-09-24'] }), TEST_FRED_API_KEY),
        sgs: new BcbSgsClient(new RecordedSgsHttpClient({ metadata: true, periods: ['2024-01-01-to-2026-09-24'] })),
      },
      indicators: new PrismaIndicatorRepository(client.prisma),
      observations: new PrismaIndicatorObservationRepository(client.prisma),
      syncStates: new PrismaIndicatorSyncStateRepository(client.prisma),
      lock: new PgAdvisorySyncLock(client.pool, INDICATOR_SYNC_ADVISORY_LOCK_KEY),
      clock: fixedClock,
    });
  });

  beforeEach(async () => {
    await resetTestDatabase(client);
  });

  afterAll(async () => {
    await disconnectTestDatabase(client);
  });

  it('should fill the database with the real catalog and every observation from 2024 when the backfill runs', async () => {
    const report = await service.backfill(CalendarDate.fromIso('2024-01-01'), CalendarDate.fromIso('2026-09-24'));

    expect(report.results).toEqual([
      { source: 'fred', code: 'IMP3510', status: 'synced', upserted: 31 },
      { source: 'fred', code: 'EPUTRADE', status: 'synced', upserted: 31 },
      { source: 'fred', code: 'B235RC1Q027SBEA', status: 'synced', upserted: 10 },
      { source: 'sgs', code: '27574', status: 'synced', upserted: 32 },
    ]);
    await expect(new PrismaIndicatorRepository(client.prisma).findByKey({ source: 'fred', code: 'B235RC1Q027SBEA' })).resolves.toEqual({
      source: 'fred',
      code: 'B235RC1Q027SBEA',
      name: 'Federal government current tax receipts: Taxes on production and imports: Customs duties',
      unit: 'Billions of Dollars',
      frequency: 'quarterly',
    });
    const latest = await new PrismaIndicatorObservationRepository(client.prisma).findLatestPerIndicator();
    expect(latest.get('fred/EPUTRADE')).toEqual({ date: CalendarDate.fromIso('2026-07-01'), value: '1248.2368946779902' });
    expect(latest.get('fred/B235RC1Q027SBEA')).toEqual({ date: CalendarDate.fromIso('2026-04-01'), value: '326.324' });
    await expect(new PrismaIndicatorSyncStateRepository(client.prisma).findByIndicator({ source: 'sgs', code: '27574' })).resolves.toMatchObject({
      lastStatus: 'success',
      lastSuccessAt: NOW,
      lastObservationDate: CalendarDate.fromIso('2026-08-01'),
    });
  });

  it('should still run while the PTAX sync holds its lock because each sync has its own lock', async () => {
    const ptaxLock = new PgAdvisorySyncLock(client.pool);

    const report = await ptaxLock.withLock(() => service.backfill(CalendarDate.fromIso('2024-01-01'), CalendarDate.fromIso('2026-09-24')));

    expect(report.results.every((result) => result.status === 'synced')).toBe(true);
  });
});
