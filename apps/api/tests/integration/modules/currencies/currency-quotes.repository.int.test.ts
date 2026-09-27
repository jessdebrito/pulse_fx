import type { DatabaseClient } from '../../../../src/database/client';
import { CalendarDate } from '../../../../src/shared/calendar-date';
import { PrismaCurrencyQuoteRepository, type CurrencyQuote } from '../../../../src/modules/currencies';
import {
  connectTestDatabase,
  disconnectTestDatabase,
  insertCurrencies,
  resetTestDatabase,
} from '../../../support/database/test-database';
import { recordedCurrencies, recordedQuotes } from '../../../support/sources/bcb-ptax/recorded-data';

interface StoredQuote {
  readonly currencyCode: string;
  readonly quotedAt: string;
  readonly quoteDate: string;
  readonly bulletin: string;
  readonly bid: number;
  readonly ask: number;
  readonly bidParity: number;
  readonly askParity: number;
}

function realUsdQuotes(): Promise<CurrencyQuote[]> {
  return recordedQuotes('USD', '2026-09-23-to-2026-09-24');
}

function storedRows(client: DatabaseClient): Promise<StoredQuote[]> {
  return client.prisma.$queryRaw<StoredQuote[]>`
    select currency_code as "currencyCode", quoted_at::text as "quotedAt", quote_date::text as "quoteDate",
           bulletin::text as bulletin, bid::float8 as bid, ask::float8 as ask,
           bid_parity::float8 as "bidParity", ask_parity::float8 as "askParity"
    from currency_quotes
    order by quoted_at`;
}

describe('PrismaCurrencyQuoteRepository', () => {
  let client: DatabaseClient;
  let repository: PrismaCurrencyQuoteRepository;

  beforeAll(() => {
    client = connectTestDatabase();
    repository = new PrismaCurrencyQuoteRepository(client.prisma);
  });

  beforeEach(async () => {
    await resetTestDatabase(client);
    await insertCurrencies(client, await recordedCurrencies('EUR', 'USD'));
  });

  afterAll(async () => {
    await disconnectTestDatabase(client);
  });

  it('should store every real bulletin with its exact values and microsecond quote time when upserting', async () => {
    await expect(repository.upsertMany('USD', await realUsdQuotes())).resolves.toBe(10);

    const rows = await storedRows(client);
    expect(rows).toHaveLength(10);
    expect(rows.at(-1)).toEqual({
      currencyCode: 'USD',
      quotedAt: '2026-09-24 16:03:18.656275+00',
      quoteDate: '2026-09-24',
      bulletin: 'closing',
      bid: 5.1789,
      ask: 5.1795,
      bidParity: 1,
      askParity: 1,
    });
  });

  it('should update the values without duplicating when the same bulletin is fetched again', async () => {
    const quotes = await realUsdQuotes();
    await repository.upsertMany('USD', quotes);

    await repository.upsertMany('USD', quotes.map((quote) => (quote.bulletin === 'closing' ? { ...quote, ask: 5.18 } : quote)));

    const rows = await storedRows(client);
    expect(rows).toHaveLength(10);
    expect(rows.filter((row) => row.bulletin === 'closing').map((row) => row.ask)).toEqual([5.18, 5.18]);
  });

  it('should return zero without touching the table when there are no quotes', async () => {
    await expect(repository.upsertMany('USD', [])).resolves.toBe(0);
    await expect(storedRows(client)).resolves.toEqual([]);
  });

  it('should report whether any quote is stored when the table goes from empty to filled', async () => {
    await expect(repository.hasAny()).resolves.toBe(false);

    await repository.upsertMany('USD', await realUsdQuotes());

    await expect(repository.hasAny()).resolves.toBe(true);
  });

  it('should return the most recent bulletin of each currency with its microsecond time when quotes exist', async () => {
    await repository.upsertMany('USD', await realUsdQuotes());

    const latest = await repository.findLatestPerCurrency();

    expect([...latest.keys()]).toEqual(['USD']);
    expect(latest.get('USD')).toEqual({
      quotedAt: '2026-09-24T13:03:18.656275-03:00',
      quoteDate: CalendarDate.fromIso('2026-09-24'),
      bulletin: 'closing',
      bid: 5.1789,
      ask: 5.1795,
      bidParity: 1,
      askParity: 1,
    });
  });

  it('should return the bulletins of one currency inside the inclusive period in chronological order', async () => {
    await repository.upsertMany('USD', await realUsdQuotes());
    await repository.upsertMany('EUR', await recordedQuotes('EUR', '2026-09-23-to-2026-09-24'));
    const sep24 = CalendarDate.fromIso('2026-09-24');

    const quotes = await repository.findByCurrencyBetween('USD', sep24, sep24);

    expect(quotes.map((quote) => `${quote.quotedAt} ${quote.bulletin} ${quote.ask}`)).toEqual([
      '2026-09-24T10:05:12.142503-03:00 opening 5.1682',
      '2026-09-24T11:05:11.049556-03:00 intermediate 5.1716',
      '2026-09-24T12:02:15.561312-03:00 intermediate 5.183',
      '2026-09-24T13:03:18.602841-03:00 intermediate 5.1953',
      '2026-09-24T13:03:18.656275-03:00 closing 5.1795',
    ]);
    expect(quotes.every((quote) => quote.quoteDate.equals(sep24))).toBe(true);
  });

  it('should list the years with quotes from the most recent and the months with quotes of each year', async () => {
    await repository.upsertMany('USD', await recordedQuotes('USD', '2025-12-30-to-2026-01-02'));
    await repository.upsertMany('USD', await realUsdQuotes());
    await repository.upsertMany('EUR', await recordedQuotes('EUR', '2026-09-23-to-2026-09-24'));

    await expect(repository.findAvailablePeriods('USD')).resolves.toEqual([
      { year: 2026, months: [1, 9] },
      { year: 2025, months: [12] },
    ]);
  });

  it('should return the closing of each day of the last calendar days counted from the latest closing of every currency, oldest first', async () => {
    await repository.upsertMany('USD', await recordedQuotes('USD', '2026-09-01-to-2026-09-25'));
    await repository.upsertMany('EUR', await recordedQuotes('EUR', '2026-09-23-to-2026-09-24'));

    const closings = await repository.findRecentClosings(8);

    expect(closings.get('USD')?.map((point) => `${point.date.toString()} ${point.value}`)).toEqual([
      '2026-09-18 5.1575',
      '2026-09-21 5.1117',
      '2026-09-22 5.1161',
      '2026-09-23 5.1414',
      '2026-09-24 5.1795',
      '2026-09-25 5.1991',
    ]);
    expect(closings.get('EUR')).toHaveLength(2);
  });

  it('should leave out the closings older than the window of calendar days', async () => {
    await repository.upsertMany('USD', await recordedQuotes('USD', '2025-12-30-to-2026-01-02'));
    await repository.upsertMany('USD', await recordedQuotes('USD', '2026-09-01-to-2026-09-25'));

    const closings = await repository.findRecentClosings(90);

    const dates = closings.get('USD')?.map((point) => point.date.toString()) ?? [];
    expect(dates).toHaveLength(18);
    expect([dates[0], dates.at(-1)]).toEqual(['2026-09-01', '2026-09-25']);
  });

  it('should keep a single closing per day when the BCB published two closings on the same day', async () => {
    await repository.upsertMany('USD', await recordedQuotes('USD', '2025-04-22-to-2025-04-24'));

    const closings = await repository.findRecentClosings(6);

    expect(closings.get('USD')?.map((point) => `${point.date.toString()} ${point.value}`)).toEqual(['2025-04-22 5.7496', '2025-04-23 5.688', '2025-04-24 5.6738']);
  });
});
