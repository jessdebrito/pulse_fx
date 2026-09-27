import type { CurrencyRepository } from './currencies.repository';
import type { CurrencyQuoteRepository } from './currency-quotes.repository';
import type { CalendarDate } from '../../shared/calendar-date';
import { DAILY_VARIATION_RULE } from '../../shared/variation.constants';
import { calculateVariation, toVariationDto } from '../../shared/variation.rules';
import { CurrencyNotFoundError } from './currencies.errors';
import type { Currency, CurrencyPeriodsDto, CurrencyQuote, CurrencyQuotesDto, CurrencySummaryDto, QuoteDto } from './currencies.types';

const CLOSINGS_FOR_VARIATION = DAILY_VARIATION_RULE.count + 1;

export interface CurrenciesReader {
  listWithLatestQuote(): Promise<CurrencySummaryDto[]>;
  getQuotes(currencyCode: string, from: CalendarDate, to: CalendarDate): Promise<CurrencyQuotesDto>;
  getAvailablePeriods(currencyCode: string): Promise<CurrencyPeriodsDto>;
}

export interface CurrenciesServiceDependencies {
  readonly currencies: CurrencyRepository;
  readonly quotes: CurrencyQuoteRepository;
}

export class CurrenciesService implements CurrenciesReader {
  constructor(private readonly dependencies: CurrenciesServiceDependencies) {}

  async listWithLatestQuote(): Promise<CurrencySummaryDto[]> {
    const [currencies, latestQuotes, recentClosings] = await Promise.all([
      this.dependencies.currencies.findAll(),
      this.dependencies.quotes.findLatestPerCurrency(),
      this.dependencies.quotes.findRecentClosings(CLOSINGS_FOR_VARIATION),
    ]);
    return currencies.map((currency) => ({
      ...currency,
      latestQuote: toOptionalQuoteDto(latestQuotes.get(currency.code)),
      variation: toVariationDto(calculateVariation(recentClosings.get(currency.code) ?? [], DAILY_VARIATION_RULE)),
    }));
  }

  async getQuotes(currencyCode: string, from: CalendarDate, to: CalendarDate): Promise<CurrencyQuotesDto> {
    const currency = await this.requireCurrency(currencyCode);
    const quotes = await this.dependencies.quotes.findByCurrencyBetween(currencyCode, from, to);
    return { ...currency, from: from.toString(), to: to.toString(), quotes: quotes.map(toQuoteDto) };
  }

  async getAvailablePeriods(currencyCode: string): Promise<CurrencyPeriodsDto> {
    await this.requireCurrency(currencyCode);
    return { code: currencyCode, periods: await this.dependencies.quotes.findAvailablePeriods(currencyCode) };
  }

  private async requireCurrency(currencyCode: string): Promise<Currency> {
    const currency = await this.dependencies.currencies.findByCode(currencyCode);
    if (currency === null) throw new CurrencyNotFoundError(currencyCode);
    return currency;
  }
}

function toQuoteDto(quote: CurrencyQuote): QuoteDto {
  return { ...quote, quoteDate: quote.quoteDate.toString() };
}

function toOptionalQuoteDto(quote: CurrencyQuote | undefined): QuoteDto | null {
  return quote === undefined ? null : toQuoteDto(quote);
}
