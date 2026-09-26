import type { CalendarDate } from '../../../shared/calendar-date';
import type { Indicator, IndicatorObservation } from '../../indicators';

export interface IndicatorSourceClient {
  fetchIndicator(code: string): Promise<Indicator>;
  fetchObservations(code: string, from: CalendarDate, to: CalendarDate): Promise<IndicatorObservation[]>;
}
