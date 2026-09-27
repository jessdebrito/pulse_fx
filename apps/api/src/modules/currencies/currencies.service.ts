import type { CurrencyRepository } from './currencies.repository';
import type { CurrencyQuoteRepository } from './currency-quotes.repository';
import type { CalendarDate } from '../../shared/calendar-date';
import { TREND_WINDOW_DAYS } from '../../shared/trend.constants';
import { toTrendDto } from '../../shared/trend.rules';
import { DAILY_VARIATION_RULE } from '../../shared/variation.constants';
import { calculateVariation, toVariationDto } from '../../shared/variation.rules';
import { CurrencyNotFoundError } from './currencies.errors';
import type { Currency, CurrencyPeriodsDto, CurrencyQuote, CurrencyQuotesDto, CurrencySummaryDto, QuoteDto } from './currencies.types';

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
      this.dependencies.quotes.findRecentClosings(TREND_WINDOW_DAYS),
    ]);
    return currencies.map((currency) => {
      const closings = recentClosings.get(currency.code) ?? [];
      return {
        ...currency,
        latestQuote: toOptionalQuoteDto(latestQuotes.get(currency.code)),
        variation: toVariationDto(calculateVariation(closings, DAILY_VARIATION_RULE)),
        trend: toTrendDto(closings),
      };
    });
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
