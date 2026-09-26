import type { AvailablePeriod, Currency, CurrencyQuote, CurrencyQuoteRepository, CurrencyRepository } from '../../../src/modules/currencies';
import type { CalendarDate } from '../../../src/shared/calendar-date';

export class InMemoryCurrencyRepository implements CurrencyRepository {
  private readonly items = new Map<string, Currency>();

  findAll(): Promise<Currency[]> {
    return Promise.resolve([...this.items.values()].sort((left, right) => left.code.localeCompare(right.code)));
  }

  findByCode(code: string): Promise<Currency | null> {
    return Promise.resolve(this.items.get(code) ?? null);
  }

  upsertMany(currencies: readonly Currency[]): Promise<number> {
    currencies.forEach((currency) => this.items.set(currency.code, currency));
    return Promise.resolve(currencies.length);
  }

  find(code: string): Currency | undefined {
    return this.items.get(code);
  }
}

export class InMemoryCurrencyQuoteRepository implements CurrencyQuoteRepository {
  private readonly rows = new Map<string, { readonly currencyCode: string; readonly quote: CurrencyQuote }>();

  upsertMany(currencyCode: string, quotes: readonly CurrencyQuote[]): Promise<number> {
    quotes.forEach((quote) => this.rows.set(`${currencyCode}|${quote.quotedAt}|${quote.bulletin}`, { currencyCode, quote }));
    return Promise.resolve(quotes.length);
  }

  hasAny(): Promise<boolean> {
    return Promise.resolve(this.rows.size > 0);
  }

  findLatestPerCurrency(): Promise<ReadonlyMap<string, CurrencyQuote>> {
    const latest = new Map<string, CurrencyQuote>();
    for (const { currencyCode, quote } of this.rows.values()) {
      const current = latest.get(currencyCode);
      if (current === undefined || current.quotedAt < quote.quotedAt) latest.set(currencyCode, quote);
    }
    return Promise.resolve(latest);
  }

  findByCurrencyBetween(currencyCode: string, from: CalendarDate, to: CalendarDate): Promise<CurrencyQuote[]> {
    const inPeriod = this.quotesOf(currencyCode).filter((quote) => !quote.quoteDate.isBefore(from) && !to.isBefore(quote.quoteDate));
    return Promise.resolve(inPeriod.sort((left, right) => left.quotedAt.localeCompare(right.quotedAt)));
  }

  findAvailablePeriods(currencyCode: string): Promise<AvailablePeriod[]> {
    const monthsByYear = new Map<number, Set<number>>();
    for (const quote of this.quotesOf(currencyCode)) {
      const [year = 0, month = 0] = quote.quoteDate.toString().split('-').map(Number);
      monthsByYear.set(year, (monthsByYear.get(year) ?? new Set<number>()).add(month));
    }
    const periods = [...monthsByYear.entries()].map(([year, months]) => ({ year, months: [...months].sort((left, right) => left - right) }));
    return Promise.resolve(periods.sort((left, right) => right.year - left.year));
  }

  quotesOf(currencyCode: string): CurrencyQuote[] {
    return [...this.rows.values()].filter((row) => row.currencyCode === currencyCode).map((row) => row.quote);
  }
}
