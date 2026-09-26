import { CalendarDate } from '../../../../src/shared/calendar-date';
import type { Clock } from '../../../../src/shared/clock';
import { BcbPtaxClient } from '../../../../src/modules/sync/sources/bcb-ptax.client';
import { ExternalSourceError, SyncInProgressError } from '../../../../src/modules/sync/sync.errors';
import { SyncService } from '../../../../src/modules/sync/sync.service';
import type { SyncState } from '../../../../src/modules/sync/sync.types';
import { InMemoryCurrencyQuoteRepository, InMemoryCurrencyRepository } from '../../../support/in-memory/currencies';
import { InMemorySyncLock, InMemorySyncStateRepository } from '../../../support/in-memory/sync';
import { recordedCurrencies } from '../../../support/sources/bcb-ptax/recorded-data';
import { RecordedPtaxHttpClient, type PtaxRecordings } from '../../../support/sources/bcb-ptax/recorded-ptax-http-client';

const THURSDAY_AFTER_CLOSING = new Date('2026-09-24T16:15:00Z');
const SUNDAY = new Date('2026-09-20T16:15:00Z');

const FULL_RECORDED_DAY: PtaxRecordings = { catalog: true, periods: ['2026-09-23-to-2026-09-24'] };

function clockAt(now: Date): Clock {
  return { now: () => now, today: () => CalendarDate.fromIso(now.toISOString().slice(0, 10)) };
}

function setup(recordings: PtaxRecordings = FULL_RECORDED_DAY, now: Date = THURSDAY_AFTER_CLOSING): {
  service: SyncService;
  http: RecordedPtaxHttpClient;
  currencies: InMemoryCurrencyRepository;
  quotes: InMemoryCurrencyQuoteRepository;
  syncStates: InMemorySyncStateRepository;
  lock: InMemorySyncLock;
} {
  const http = new RecordedPtaxHttpClient(recordings);
  const currencies = new InMemoryCurrencyRepository();
  const quotes = new InMemoryCurrencyQuoteRepository();
  const syncStates = new InMemorySyncStateRepository();
  const lock = new InMemorySyncLock();
  const service = new SyncService({ currencies, quotes, syncStates, lock, ptax: new BcbPtaxClient(http), clock: clockAt(now) });
  return { service, http, currencies, quotes, syncStates, lock };
}

function syncedState(currencyCode: string, lastObservationDate: string): SyncState {
  return {
    currencyCode,
    lastAttemptAt: THURSDAY_AFTER_CLOSING,
    lastSuccessAt: THURSDAY_AFTER_CLOSING,
    lastStatus: 'success',
    lastError: null,
    lastObservationDate: CalendarDate.fromIso(lastObservationDate),
  };
}

describe('SyncService.run', () => {
  it('should store the BCB currency catalog when the run starts', async () => {
    const { service, currencies } = setup();

    const report = await service.run();

    expect(report.catalog).toEqual({ status: 'synced', currencies: 10 });
    expect(currencies.find('USD')).toEqual({ code: 'USD', name: 'Dólar dos Estados Unidos', type: 'A' });
  });

  it('should request yesterday and today for every catalog currency when nothing was synced yet', async () => {
    const { service, http } = setup();

    await service.run();

    const quoteUrls = http.requestedUrls.filter((url) => url.includes('CotacaoMoedaPeriodo'));
    expect(quoteUrls).toHaveLength(10);
    expect(quoteUrls.every((url) => url.includes("@dataInicial='09-23-2026'") && url.includes("@dataFinalCotacao='09-24-2026'"))).toBe(true);
  });

  it('should store every real bulletin and record the sync state when the BCB answers every currency', async () => {
    const { service, quotes, syncStates } = setup();

    const report = await service.run();

    expect(report.results).toHaveLength(10);
    expect(report.results.every((result) => result.status === 'synced' && result.upserted === 10)).toBe(true);
    const gbpOnSep24 = quotes.quotesOf('GBP').filter((quote) => quote.quoteDate.toString() === '2026-09-24');
    expect(gbpOnSep24.map((quote) => quote.bulletin)).toEqual(['opening', 'intermediate', 'intermediate', 'intermediate', 'closing']);
    expect(syncStates.find('USD')).toEqual(syncedState('USD', '2026-09-24'));
  });

  it('should start from the last stored quote date when the currency already has data', async () => {
    const { service, http, syncStates } = setup({ catalog: true, periods: ['2026-09-23-to-2026-09-24', '2026-09-22-to-2026-09-24'] });
    await syncStates.save(syncedState('USD', '2026-09-22'));

    const report = await service.run();

    expect(http.quoteUrlsFor('USD')[0]).toContain("@dataInicial='09-22-2026'");
    expect(report.results.find((result) => result.currencyCode === 'USD')).toEqual({ currencyCode: 'USD', status: 'synced', upserted: 15 });
  });

  it('should keep syncing quotes of the stored catalog when the BCB catalog request fails', async () => {
    const { service, currencies } = setup({ ...FULL_RECORDED_DAY, catalog: new ExternalSourceError('Moedas unavailable') });
    await currencies.upsertMany(await recordedCurrencies('USD'));

    const report = await service.run();

    expect(report.catalog).toEqual({ status: 'failed', currencies: 0, error: 'Moedas unavailable' });
    expect(report.results).toEqual([{ currencyCode: 'USD', status: 'synced', upserted: 10 }]);
  });

  it('should record the failure and continue with the next currency when a quote request fails', async () => {
    const { service, syncStates } = setup({ ...FULL_RECORDED_DAY, failures: { USD: new ExternalSourceError('BCB timeout') } });

    const report = await service.run();

    expect(report.results.find((result) => result.currencyCode === 'USD')).toEqual({ currencyCode: 'USD', status: 'failed', upserted: 0, error: 'BCB timeout' });
    expect(report.results.find((result) => result.currencyCode === 'EUR')).toEqual({ currencyCode: 'EUR', status: 'synced', upserted: 10 });
    expect(syncStates.find('USD')).toMatchObject({ lastStatus: 'failure', lastError: 'BCB timeout', lastAttemptAt: THURSDAY_AFTER_CLOSING, lastSuccessAt: null });
  });

  it('should keep the last observation date when the BCB has no new quotes over the weekend', async () => {
    const { service, syncStates } = setup({ catalog: true, periods: ['2026-09-19-to-2026-09-20'] }, SUNDAY);
    await syncStates.save(syncedState('USD', '2026-09-19'));

    const report = await service.run();

    expect(report.results.every((result) => result.status === 'synced' && result.upserted === 0)).toBe(true);
    expect(syncStates.find('USD')?.lastObservationDate?.toString()).toBe('2026-09-19');
  });

  it('should throw SyncInProgressError when another sync holds the lock', async () => {
    const { service, lock } = setup();
    lock.isHeldElsewhere = true;

    await expect(service.run()).rejects.toThrow(SyncInProgressError);
  });

  it('should stamp the report with the clock time when the run finishes', async () => {
    const { service } = setup();

    const report = await service.run();

    expect(report.startedAt).toBe(THURSDAY_AFTER_CLOSING.toISOString());
    expect(report.finishedAt).toBe(THURSDAY_AFTER_CLOSING.toISOString());
  });
});

describe('SyncService.runInitialLoad', () => {
  it('should run the sync when no quote is stored yet', async () => {
    const { service, quotes } = setup();

    const report = await service.runInitialLoad();

    expect(report?.catalog.currencies).toBe(10);
    await expect(quotes.hasAny()).resolves.toBe(true);
  });

  it('should skip the sync and return null when quotes already exist', async () => {
    const { service, http } = setup();
    await service.run();
    const requestsBefore = http.requestedUrls.length;

    await expect(service.runInitialLoad()).resolves.toBeNull();
    expect(http.requestedUrls).toHaveLength(requestsBefore);
  });
});
