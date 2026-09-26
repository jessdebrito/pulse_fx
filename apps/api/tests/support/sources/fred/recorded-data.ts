import type { Indicator, IndicatorObservation } from '../../../../src/modules/indicators';
import { FredClient } from '../../../../src/modules/sync/sources/fred.client';
import { CalendarDate } from '../../../../src/shared/calendar-date';
import { RecordedFredHttpClient, TEST_FRED_API_KEY, type RecordedFredPeriod } from './recorded-fred-http-client';

export function recordedFredIndicator(seriesId: string): Promise<Indicator> {
  return new FredClient(new RecordedFredHttpClient({ series: true }), TEST_FRED_API_KEY).fetchIndicator(seriesId);
}

export function recordedFredObservations(seriesId: string, period: RecordedFredPeriod): Promise<IndicatorObservation[]> {
  const [from = '', to = ''] = period.split('-to-');
  const client = new FredClient(new RecordedFredHttpClient({ periods: [period] }), TEST_FRED_API_KEY);
  return client.fetchObservations(seriesId, CalendarDate.fromIso(from), CalendarDate.fromIso(to));
}
