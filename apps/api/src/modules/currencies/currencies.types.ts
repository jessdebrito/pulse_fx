import type { CalendarDate } from '../../shared/calendar-date';

export type CurrencyType = 'A' | 'B';

export interface Currency {
  readonly code: string;
  readonly name: string;
  readonly type: CurrencyType;
}

export type Bulletin = 'opening' | 'intermediate' | 'closing';

export interface CurrencyQuote {
  readonly quotedAt: string;
  readonly quoteDate: CalendarDate;
  readonly bulletin: Bulletin;
  readonly bid: number;
  readonly ask: number;
  readonly bidParity: number;
  readonly askParity: number;
}

export interface QuoteDto {
  readonly quotedAt: string;
  readonly quoteDate: string;
  readonly bulletin: Bulletin;
  readonly bid: number;
  readonly ask: number;
  readonly bidParity: number;
  readonly askParity: number;
}

export interface CurrencySummaryDto {
  readonly code: string;
  readonly name: string;
  readonly type: CurrencyType;
  readonly latestQuote: QuoteDto | null;
}

export interface CurrencyQuotesDto {
  readonly code: string;
  readonly name: string;
  readonly type: CurrencyType;
  readonly from: string;
  readonly to: string;
  readonly quotes: readonly QuoteDto[];
}

export interface AvailablePeriod {
  readonly year: number;
  readonly months: readonly number[];
}

export interface CurrencyPeriodsDto {
  readonly code: string;
  readonly periods: readonly AvailablePeriod[];
}
