import type { CalendarDate } from '../../shared/calendar-date';
import type { Clock } from '../../shared/clock';
import type { CurrencyQuote, CurrencyQuoteRepository, CurrencyRepository } from '../currencies';
import type { PtaxClient } from './sources/bcb-ptax.client';
import type { SyncLock } from './sync-lock.repository';
import { initialSyncState, syncStartDate, yearChunks } from './sync-policy.rules';
import type { SyncStateRepository } from './sync-state.repository';
import type { BackfillReportDto, CalendarRange, CatalogSyncResultDto, QuoteSyncResultDto, SyncReportDto, SyncState } from './sync.types';

export interface SyncRunner {
  run(): Promise<SyncReportDto>;
  runInitialLoad(): Promise<SyncReportDto | null>;
  backfill(from: CalendarDate, to: CalendarDate): Promise<BackfillReportDto>;
}

export interface SyncServiceDependencies {
  readonly currencies: CurrencyRepository;
  readonly quotes: CurrencyQuoteRepository;
  readonly syncStates: SyncStateRepository;
  readonly lock: SyncLock;
  readonly ptax: PtaxClient;
  readonly clock: Clock;
}

type RangesFor = (state: SyncState, today: CalendarDate) => readonly CalendarRange[];

export class SyncService implements SyncRunner {
  constructor(private readonly dependencies: SyncServiceDependencies) {}

  run(): Promise<SyncReportDto> {
    return this.dependencies.lock.withLock(() => this.syncAll());
  }

  async runInitialLoad(): Promise<SyncReportDto | null> {
    if (await this.dependencies.quotes.hasAny()) return null;
    return this.run();
  }

  backfill(from: CalendarDate, to: CalendarDate): Promise<BackfillReportDto> {
    return this.dependencies.lock.withLock(() => this.backfillAll(from, to));
  }

  private async syncAll(): Promise<SyncReportDto> {
    const startedAt = this.dependencies.clock.now().toISOString();
    const catalog = await this.syncCatalog();
    const results = await this.syncEveryCurrency((state, today) => [{ from: syncStartDate(state, today), to: today }]);
    return { startedAt, finishedAt: this.dependencies.clock.now().toISOString(), catalog, results };
  }

  private async backfillAll(from: CalendarDate, to: CalendarDate): Promise<BackfillReportDto> {
    const startedAt = this.dependencies.clock.now().toISOString();
    const chunks = yearChunks(from, to);
    const results = await this.syncEveryCurrency(() => chunks);
    return { startedAt, finishedAt: this.dependencies.clock.now().toISOString(), from: from.toString(), to: to.toString(), results };
  }

  private async syncCatalog(): Promise<CatalogSyncResultDto> {
    try {
      const currencies = await this.dependencies.ptax.fetchCurrencies();
      return { status: 'synced', currencies: await this.dependencies.currencies.upsertMany(currencies) };
    } catch (error) {
      return { status: 'failed', currencies: 0, error: errorMessage(error) };
    }
  }

  private async syncEveryCurrency(rangesFor: RangesFor): Promise<QuoteSyncResultDto[]> {
    const currencies = await this.dependencies.currencies.findAll();
    const results: QuoteSyncResultDto[] = [];
    for (const currency of currencies) {
      results.push(await this.syncCurrency(currency.code, rangesFor));
    }
    return results;
  }

  private async syncCurrency(currencyCode: string, rangesFor: RangesFor): Promise<QuoteSyncResultDto> {
    const state = (await this.dependencies.syncStates.findByCurrency(currencyCode)) ?? initialSyncState(currencyCode);
    const now = this.dependencies.clock.now();
    try {
      const fetched: CurrencyQuote[] = [];
      let upserted = 0;
      for (const range of rangesFor(state, this.dependencies.clock.today())) {
        const quotes = await this.dependencies.ptax.fetchQuotes(currencyCode, range.from, range.to);
        upserted += await this.dependencies.quotes.upsertMany(currencyCode, quotes);
        fetched.push(...quotes);
      }
      await this.dependencies.syncStates.save(succeededState(state, now, fetched));
      return { currencyCode, status: 'synced', upserted };
    } catch (error) {
      const message = errorMessage(error);
      await this.dependencies.syncStates.save({ ...state, lastAttemptAt: now, lastStatus: 'failure', lastError: message });
      return { currencyCode, status: 'failed', upserted: 0, error: message };
    }
  }
}

function succeededState(state: SyncState, now: Date, quotes: readonly CurrencyQuote[]): SyncState {
  const lastObservationDate = quotes.reduce(
    (latest, quote) => (latest === null || latest.isBefore(quote.quoteDate) ? quote.quoteDate : latest),
    state.lastObservationDate,
  );
  return { ...state, lastAttemptAt: now, lastSuccessAt: now, lastStatus: 'success', lastError: null, lastObservationDate };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
