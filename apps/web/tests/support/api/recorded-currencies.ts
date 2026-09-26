import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import {
  currencyPeriodsSchema,
  currencyQuotesSchema,
  currencySummarySchema,
  type CurrencyPeriods,
  type CurrencyQuotes,
  type CurrencySummary,
} from '../../../src/api/currencies';
import type { HttpResponse } from '../../../src/api/http';

function readFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(__dirname, '../../fixtures/api', name), 'utf8'));
}

export function recordedCurrenciesResponse(): unknown {
  return readFixture('currencies.json');
}

export function recordedCurrencySummaries(): CurrencySummary[] {
  return z.array(currencySummarySchema).parse(recordedCurrenciesResponse());
}

export function recordedCurrency(code: string): CurrencySummary {
  const currency = recordedCurrencySummaries().find((item) => item.code === code);
  if (currency === undefined) throw new Error(`Currency ${code} is not in the recorded API response`);
  return currency;
}

export function recordedUsdQuotesResponse(): unknown {
  return readFixture('currency-quotes-usd.json');
}

export function recordedUsdQuotes(): CurrencyQuotes {
  return currencyQuotesSchema.parse(recordedUsdQuotesResponse());
}

export function recordedUsdPeriodsResponse(): unknown {
  return readFixture('currency-periods-usd.json');
}

export function recordedUsdPeriods(): CurrencyPeriods {
  return currencyPeriodsSchema.parse(recordedUsdPeriodsResponse());
}

export function recordedUsdPeriodsAcrossYears(): CurrencyPeriods {
  return currencyPeriodsSchema.parse(readFixture('currency-periods-usd-across-years.json'));
}

export function jsonResponse(body: unknown, status = 200): HttpResponse {
  return { ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) };
}
