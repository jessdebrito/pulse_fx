import type { DatabaseClient } from '../../../../src/database/client';
import { PrismaCurrencyQuoteRepository, PrismaCurrencyRepository } from '../../../../src/modules/currencies';
import { BcbPtaxClient } from '../../../../src/modules/sync/sources/bcb-ptax.client';
import { PgAdvisorySyncLock } from '../../../../src/modules/sync/sync-lock.repository';
import { PrismaSyncStateRepository } from '../../../../src/modules/sync/sync-state.repository';
import { SyncService } from '../../../../src/modules/sync/sync.service';
import { CalendarDate } from '../../../../src/shared/calendar-date';
import type { Clock } from '../../../../src/shared/clock';
import { connectTestDatabase, disconnectTestDatabase, resetTestDatabase } from '../../../support/database/test-database';
import { RecordedPtaxHttpClient } from '../../../support/sources/bcb-ptax/recorded-ptax-http-client';

const NOW = new Date('2026-09-24T16:15:00.000Z');

const fixedClock: Clock = {
  now: () => NOW,
  today: () => CalendarDate.fromIso('2026-09-24'),
};

describe('SyncService with PostgreSQL', () => {
  let client: DatabaseClient;
  let service: SyncService;

  beforeAll(() => {
    client = connectTestDatabase();
    const http = new RecordedPtaxHttpClient({ catalog: true, periods: ['2026-09-23-to-2026-09-24'] });
    service = new SyncService({
      currencies: new PrismaCurrencyRepository(client.prisma),
      quotes: new PrismaCurrencyQuoteRepository(client.prisma),
      syncStates: new PrismaSyncStateRepository(client.prisma),
      lock: new PgAdvisorySyncLock(client.pool),
      ptax: new BcbPtaxClient(http),
      clock: fixedClock,
    });
  });

  beforeEach(async () => {
    await resetTestDatabase(client);
  });

  afterAll(async () => {
    await disconnectTestDatabase(client);
  });

  it('should fill an empty database with the real BCB catalog and every bulletin when the initial load runs', async () => {
    const report = await service.runInitialLoad();

    expect(report?.catalog).toEqual({ status: 'synced', currencies: 10 });
    expect(report?.results.every((result) => result.status === 'synced' && result.upserted === 10)).toBe(true);
    await expect(new PrismaCurrencyRepository(client.prisma).findAll()).resolves.toHaveLength(10);
    const gbpDay = await client.prisma.currencyQuote.findMany({
      where: { currencyCode: 'GBP', quoteDate: new Date('2026-09-24T00:00:00.000Z') },
      orderBy: { quotedAt: 'asc' },
    });
    expect(gbpDay.map((row) => ({ bulletin: row.bulletin, ask: row.ask.toNumber(), askParity: row.askParity.toNumber() }))).toEqual([
      { bulletin: 'opening', ask: 6.8386, askParity: 1.3232 },
      { bulletin: 'intermediate', ask: 6.84, askParity: 1.3226 },
      { bulletin: 'intermediate', ask: 6.8519, askParity: 1.322 },
      { bulletin: 'intermediate', ask: 6.8666, askParity: 1.3217 },
      { bulletin: 'closing', ask: 6.8457, askParity: 1.3217 },
    ]);
    await expect(new PrismaSyncStateRepository(client.prisma).findByCurrency('USD')).resolves.toMatchObject({
      lastStatus: 'success',
      lastSuccessAt: NOW,
      lastObservationDate: CalendarDate.fromIso('2026-09-24'),
    });
  });

  it('should skip the initial load when the database already has quotes', async () => {
    await service.run();

    await expect(service.runInitialLoad()).resolves.toBeNull();
  });
});
