import { z } from 'zod';
import type { DateRange } from '../lib/periods';

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
  periods: z.array(z.object({ year: z.number().int(), months: z.array(z.number().int().min(1).max(12)) })),
});

const currenciesResponseSchema = z.array(currencySummarySchema);

export type Quote = z.infer<typeof quoteSchema>;

export type CurrencySummary = z.infer<typeof currencySummarySchema>;

export type CurrencyQuotes = z.infer<typeof currencyQuotesSchema>;

export type CurrencyPeriods = z.infer<typeof currencyPeriodsSchema>;

export type Bulletin = Quote['bulletin'];

export interface HttpResponse {
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
}

export type FetchFunction = (url: string) => Promise<HttpResponse>;

const CURRENCIES_ROUTE = '/api/currencies';

const browserFetch: FetchFunction = (url) => fetch(url);

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

async function getJson<T>(fetchFunction: FetchFunction, url: string, schema: z.ZodType<T>): Promise<T> {
  const response = await fetchFunction(url);
  if (!response.ok) {
    throw new Error(`GET ${url} responded with HTTP ${response.status}`);
  }
  return schema.parse(await response.json());
}
