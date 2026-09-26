import type { CalendarDate } from '../../shared/calendar-date';
import type { AvailablePeriod } from '../currencies';

export type IndicatorSource = 'fred' | 'sgs';

export type IndicatorFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';

export interface IndicatorKey {
  readonly source: IndicatorSource;
  readonly code: string;
}

export interface Indicator extends IndicatorKey {
  readonly name: string;
  readonly unit: string;
  readonly frequency: IndicatorFrequency;
}

export interface IndicatorObservation {
  readonly date: CalendarDate;
  readonly value: string;
}

export interface ObservationDto {
  readonly date: string;
  readonly value: number;
}

export interface IndicatorSummaryDto extends Indicator {
  readonly latestObservation: ObservationDto | null;
}

export interface IndicatorObservationsDto extends Indicator {
  readonly from: string;
  readonly to: string;
  readonly observations: readonly ObservationDto[];
}

export interface IndicatorPeriodsDto extends IndicatorKey {
  readonly periods: readonly AvailablePeriod[];
}
