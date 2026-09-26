import type { CalendarDate } from '../../shared/calendar-date';
import type { IndicatorObservationRepository } from './indicator-observations.repository';
import { IndicatorNotFoundError } from './indicators.errors';
import type { IndicatorRepository } from './indicators.repository';
import { indicatorId } from './indicators.rules';
import type {
  Indicator,
  IndicatorKey,
  IndicatorObservation,
  IndicatorObservationsDto,
  IndicatorPeriodsDto,
  IndicatorSummaryDto,
  ObservationDto,
} from './indicators.types';

export interface IndicatorsReader {
  listWithLatestObservation(): Promise<IndicatorSummaryDto[]>;
  getObservations(key: IndicatorKey, from: CalendarDate, to: CalendarDate): Promise<IndicatorObservationsDto>;
  getAvailablePeriods(key: IndicatorKey): Promise<IndicatorPeriodsDto>;
}

export interface IndicatorsServiceDependencies {
  readonly indicators: IndicatorRepository;
  readonly observations: IndicatorObservationRepository;
}

export class IndicatorsService implements IndicatorsReader {
  constructor(private readonly dependencies: IndicatorsServiceDependencies) {}

  async listWithLatestObservation(): Promise<IndicatorSummaryDto[]> {
    const [indicators, latestObservations] = await Promise.all([
      this.dependencies.indicators.findAll(),
      this.dependencies.observations.findLatestPerIndicator(),
    ]);
    return indicators.map((indicator) => ({ ...indicator, latestObservation: toOptionalObservationDto(latestObservations.get(indicatorId(indicator))) }));
  }

  async getObservations(key: IndicatorKey, from: CalendarDate, to: CalendarDate): Promise<IndicatorObservationsDto> {
    const indicator = await this.requireIndicator(key);
    const observations = await this.dependencies.observations.findBetween(key, from, to);
    return { ...indicator, from: from.toString(), to: to.toString(), observations: observations.map(toObservationDto) };
  }

  async getAvailablePeriods(key: IndicatorKey): Promise<IndicatorPeriodsDto> {
    await this.requireIndicator(key);
    return { source: key.source, code: key.code, periods: await this.dependencies.observations.findAvailablePeriods(key) };
  }

  private async requireIndicator(key: IndicatorKey): Promise<Indicator> {
    const indicator = await this.dependencies.indicators.findByKey(key);
    if (indicator === null) throw new IndicatorNotFoundError(key);
    return indicator;
  }
}

function toObservationDto(observation: IndicatorObservation): ObservationDto {
  return { date: observation.date.toString(), value: Number(observation.value) };
}

function toOptionalObservationDto(observation: IndicatorObservation | undefined): ObservationDto | null {
  return observation === undefined ? null : toObservationDto(observation);
}
