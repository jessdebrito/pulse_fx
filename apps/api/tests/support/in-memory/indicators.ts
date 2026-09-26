import type { AvailablePeriod } from '../../../src/modules/currencies';
import {
  indicatorId,
  type Indicator,
  type IndicatorKey,
  type IndicatorObservation,
  type IndicatorObservationRepository,
  type IndicatorRepository,
} from '../../../src/modules/indicators';
import type { CalendarDate } from '../../../src/shared/calendar-date';

export class InMemoryIndicatorRepository implements IndicatorRepository {
  private readonly items = new Map<string, Indicator>();

  findAll(): Promise<Indicator[]> {
    const ordered = [...this.items.values()].sort((left, right) => left.source.localeCompare(right.source) || left.code.localeCompare(right.code));
    return Promise.resolve(ordered);
  }

  findByKey(key: IndicatorKey): Promise<Indicator | null> {
    return Promise.resolve(this.items.get(indicatorId(key)) ?? null);
  }

  upsert(indicator: Indicator): Promise<void> {
    this.items.set(indicatorId(indicator), indicator);
    return Promise.resolve();
  }

  find(key: IndicatorKey): Indicator | undefined {
    return this.items.get(indicatorId(key));
  }
}

interface StoredObservation {
  readonly id: string;
  readonly observation: IndicatorObservation;
}

export class InMemoryIndicatorObservationRepository implements IndicatorObservationRepository {
  private readonly rows = new Map<string, StoredObservation>();

  upsertMany(key: IndicatorKey, observations: readonly IndicatorObservation[]): Promise<number> {
    const id = indicatorId(key);
    observations.forEach((observation) => this.rows.set(`${id}|${observation.date.toString()}`, { id, observation }));
    return Promise.resolve(observations.length);
  }

  findLatestPerIndicator(): Promise<ReadonlyMap<string, IndicatorObservation>> {
    const latest = new Map<string, IndicatorObservation>();
    for (const { id, observation } of this.rows.values()) {
      const current = latest.get(id);
      if (current === undefined || current.date.isBefore(observation.date)) latest.set(id, observation);
    }
    return Promise.resolve(latest);
  }

  findBetween(key: IndicatorKey, from: CalendarDate, to: CalendarDate): Promise<IndicatorObservation[]> {
    const inPeriod = this.observationsOf(key).filter((observation) => !observation.date.isBefore(from) && !to.isBefore(observation.date));
    return Promise.resolve(inPeriod.sort((left, right) => left.date.toString().localeCompare(right.date.toString())));
  }

  findAvailablePeriods(key: IndicatorKey): Promise<AvailablePeriod[]> {
    const monthsByYear = new Map<number, Set<number>>();
    for (const observation of this.observationsOf(key)) {
      const [year = 0, month = 0] = observation.date.toString().split('-').map(Number);
      monthsByYear.set(year, (monthsByYear.get(year) ?? new Set<number>()).add(month));
    }
    const periods = [...monthsByYear.entries()].map(([year, months]) => ({ year, months: [...months].sort((left, right) => left - right) }));
    return Promise.resolve(periods.sort((left, right) => right.year - left.year));
  }

  observationsOf(key: IndicatorKey): IndicatorObservation[] {
    const id = indicatorId(key);
    return [...this.rows.values()].filter((row) => row.id === id).map((row) => row.observation);
  }
}
