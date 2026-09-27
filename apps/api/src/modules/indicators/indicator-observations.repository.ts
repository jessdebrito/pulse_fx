import type { Database } from '../../database/client';
import { Prisma } from '../../generated/prisma/client';
import { CalendarDate } from '../../shared/calendar-date';
import type { AvailablePeriod } from '../currencies';
import { indicatorId } from './indicators.rules';
import type { IndicatorKey, IndicatorObservation, IndicatorSource } from './indicators.types';

export interface IndicatorObservationRepository {
  upsertMany(key: IndicatorKey, observations: readonly IndicatorObservation[]): Promise<number>;
  findLatestPerIndicator(): Promise<ReadonlyMap<string, IndicatorObservation>>;
  findBetween(key: IndicatorKey, from: CalendarDate, to: CalendarDate): Promise<IndicatorObservation[]>;
  findAvailablePeriods(key: IndicatorKey): Promise<AvailablePeriod[]>;
  findRecentPerIndicator(months: number): Promise<ReadonlyMap<string, IndicatorObservation[]>>;
}

interface ObservationRow {
  readonly source: IndicatorSource;
  readonly code: string;
  readonly date: string;
  readonly value: string;
}

const OBSERVATION_COLUMNS = Prisma.sql`
  source::text as source,
  code,
  observation_date::text as date,
  trim_scale(value)::text as value`;

export class PrismaIndicatorObservationRepository implements IndicatorObservationRepository {
  constructor(private readonly prisma: Database) {}

  async upsertMany(key: IndicatorKey, observations: readonly IndicatorObservation[]): Promise<number> {
    if (observations.length === 0) return 0;
    await this.prisma.$transaction(observations.map((observation) => this.upsertObservation(key, observation)));
    return observations.length;
  }

  async findLatestPerIndicator(): Promise<ReadonlyMap<string, IndicatorObservation>> {
    const rows = await this.prisma.$queryRaw<ObservationRow[]>`
      select distinct on (source, code) ${OBSERVATION_COLUMNS}
      from indicator_observations
      order by source, code, observation_date desc`;
    return new Map(rows.map((row) => [indicatorId(row), toObservation(row)]));
  }

  async findBetween(key: IndicatorKey, from: CalendarDate, to: CalendarDate): Promise<IndicatorObservation[]> {
    const rows = await this.prisma.$queryRaw<ObservationRow[]>`
      select ${OBSERVATION_COLUMNS}
      from indicator_observations
      where source = ${key.source}::indicator_source
        and code = ${key.code}
        and observation_date between ${from.toString()}::date and ${to.toString()}::date
      order by observation_date`;
    return rows.map(toObservation);
  }

  findAvailablePeriods(key: IndicatorKey): Promise<AvailablePeriod[]> {
    return this.prisma.$queryRaw<AvailablePeriod[]>`
      select
        extract(year from observation_date)::int as year,
        array_agg(distinct extract(month from observation_date)::int order by extract(month from observation_date)::int) as months
      from indicator_observations
      where source = ${key.source}::indicator_source and code = ${key.code}
      group by 1
      order by 1 desc`;
  }

  async findRecentPerIndicator(months: number): Promise<ReadonlyMap<string, IndicatorObservation[]>> {
    const rows = await this.prisma.$queryRaw<ObservationRow[]>`
      select ${OBSERVATION_COLUMNS}
      from indicator_observations
      join (
        select source as latest_source, code as latest_code, max(observation_date) as latest_date
        from indicator_observations
        group by source, code
      ) as latest on latest_source = source and latest_code = code
      where observation_date >= (latest_date - make_interval(months => ${months}::int))::date
      order by source, code, observation_date`;
    const recent = new Map<string, IndicatorObservation[]>();
    for (const row of rows) {
      const id = indicatorId(row);
      recent.set(id, [...(recent.get(id) ?? []), toObservation(row)]);
    }
    return recent;
  }

  private upsertObservation(key: IndicatorKey, observation: IndicatorObservation): ReturnType<Database['indicatorObservation']['upsert']> {
    const observationDate = observation.date.toUtcDate();
    const value = new Prisma.Decimal(observation.value);
    return this.prisma.indicatorObservation.upsert({
      where: { source_code_observationDate: { source: key.source, code: key.code, observationDate } },
      create: { source: key.source, code: key.code, observationDate, value },
      update: { value, fetchedAt: new Date() },
    });
  }
}

function toObservation(row: ObservationRow): IndicatorObservation {
  return { date: CalendarDate.fromIso(row.date), value: row.value };
}
