import type { Indicator, IndicatorObservation } from '../../../../src/modules/indicators';
import { BcbSgsClient } from '../../../../src/modules/sync/sources/bcb-sgs.client';
import { CalendarDate } from '../../../../src/shared/calendar-date';
import { RecordedSgsHttpClient, type RecordedSgsPeriod } from './recorded-sgs-http-client';

export function recordedSgsIndicator(seriesCode: string): Promise<Indicator> {
  return new BcbSgsClient(new RecordedSgsHttpClient({ metadata: true })).fetchIndicator(seriesCode);
}

export function recordedSgsObservations(seriesCode: string, period: RecordedSgsPeriod): Promise<IndicatorObservation[]> {
  const [from = '', to = ''] = period.split('-to-');
  const client = new BcbSgsClient(new RecordedSgsHttpClient({ periods: [period] }));
  return client.fetchObservations(seriesCode, CalendarDate.fromIso(from), CalendarDate.fromIso(to));
}
