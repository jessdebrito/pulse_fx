import { z } from 'zod';
import type { DateRange } from '../lib/periods';
import { browserFetch, getJson, type FetchFunction } from './http';
import { availablePeriodsSchema, trendSchema, variationSchema } from './schemas';

const quoteSchema = z.object({
  quotedAt: z.string(),
  quoteDate: z.string(),
  bulletin: z.enum(['opening', 'intermediate', 'closing']),
  bid: z.number(),
  ask: z.number(),
  bidParity: z.number(),
  askParity: z.number(),
});

export const currencySummarySchema = z.object({
  code: z.string().length(3),
  name: z.string().min(1),
  type: z.enum(['A', 'B']),
  latestQuote: quoteSchema.nullable(),
  variation: variationSchema.nullable(),
  trend: trendSchema,
});

export const currencyQuotesSchema = z.object({
  code: z.string().length(3),
  name: z.string().min(1),
  type: z.enum(['A', 'B']),
  from: z.string(),
  to: z.string(),
  quotes: z.array(quoteSchema),
});

export const currencyPeriodsSchema = z.object({
  code: z.string().length(3),
  periods: availablePeriodsSchema,
});

const currenciesResponseSchema = z.array(currencySummarySchema);

export type Quote = z.infer<typeof quoteSchema>;

export type CurrencySummary = z.infer<typeof currencySummarySchema>;

export type CurrencyQuotes = z.infer<typeof currencyQuotesSchema>;

export type CurrencyPeriods = z.infer<typeof currencyPeriodsSchema>;

export type Bulletin = Quote['bulletin'];

const CURRENCIES_ROUTE = '/api/currencies';

export function fetchCurrencies(fetchFunction: FetchFunction = browserFetch): Promise<CurrencySummary[]> {
  return getJson(fetchFunction, CURRENCIES_ROUTE, currenciesResponseSchema);
}

export function fetchCurrencyQuotes(code: string, range: DateRange, fetchFunction: FetchFunction = browserFetch): Promise<CurrencyQuotes> {
  const query = new URLSearchParams({ from: range.from, to: range.to });
  return getJson(fetchFunction, `${CURRENCIES_ROUTE}/${encodeURIComponent(code)}/quotes?${query.toString()}`, currencyQuotesSchema);
}

export function fetchCurrencyPeriods(code: string, fetchFunction: FetchFunction = browserFetch): Promise<CurrencyPeriods> {
  return getJson(fetchFunction, `${CURRENCIES_ROUTE}/${encodeURIComponent(code)}/periods`, currencyPeriodsSchema);
}
