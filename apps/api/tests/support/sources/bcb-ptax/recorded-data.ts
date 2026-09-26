import type { Currency, CurrencyQuote } from '../../../../src/modules/currencies';
import { BcbPtaxClient } from '../../../../src/modules/sync/sources/bcb-ptax.client';
import { CalendarDate } from '../../../../src/shared/calendar-date';
import { RecordedPtaxHttpClient, type RecordedPeriod } from './recorded-ptax-http-client';

export async function recordedCurrencies(...codes: readonly string[]): Promise<Currency[]> {
  const catalog = await new BcbPtaxClient(new RecordedPtaxHttpClient({ catalog: true })).fetchCurrencies();
  return codes.map((code) => {
    const currency = catalog.find((item) => item.code === code);
    if (currency === undefined) throw new Error(`Currency ${code} is not in the recorded BCB catalog`);
    return currency;
  });
}

export function recordedQuotes(currencyCode: string, period: RecordedPeriod): Promise<CurrencyQuote[]> {
  const [from = '', to = ''] = period.split('-to-');
  const client = new BcbPtaxClient(new RecordedPtaxHttpClient({ periods: [period] }));
  return client.fetchQuotes(currencyCode, CalendarDate.fromIso(from), CalendarDate.fromIso(to));
}
