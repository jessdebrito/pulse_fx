import type { DatabaseClient } from '../../../../src/database/client';
import { PrismaIndicatorObservationRepository, type IndicatorKey } from '../../../../src/modules/indicators';
import { CalendarDate } from '../../../../src/shared/calendar-date';
import { connectTestDatabase, disconnectTestDatabase, insertIndicators, resetTestDatabase } from '../../../support/database/test-database';
import { recordedSgsIndicator, recordedSgsObservations } from '../../../support/sources/bcb-sgs/recorded-data';
import { recordedFredIndicator, recordedFredObservations } from '../../../support/sources/fred/recorded-data';

const TRADE_POLICY_UNCERTAINTY: IndicatorKey = { source: 'fred', code: 'EPUTRADE' };
const US_IMPORTS_FROM_BRAZIL: IndicatorKey = { source: 'fred', code: 'IMP3510' };
const BRAZIL_COMMODITIES_INDEX: IndicatorKey = { source: 'sgs', code: '27574' };

interface StoredObservation {
  readonly source: string;
  readonly code: string;
  readonly date: string;
  readonly value: string;
}

function storedRows(client: DatabaseClient): Promise<StoredObservation[]> {
  return client.prisma.$queryRaw<StoredObservation[]>`
    select source::text as source, code, observation_date::text as date, trim_scale(value)::text as value
    from indicator_observations
    order by source, code, observation_date`;
}

describe('PrismaIndicatorObservationRepository', () => {
  let client: DatabaseClient;
  let repository: PrismaIndicatorObservationRepository;

  beforeAll(() => {
    client = connectTestDatabase();
    repository = new PrismaIndicatorObservationRepository(client.prisma);
  });

  beforeEach(async () => {
    await resetTestDatabase(client);
    await insertIndicators(client, [await recordedFredIndicator('EPUTRADE'), await recordedFredIndicator('IMP3510'), await recordedSgsIndicator('27574')]);
  });

  afterAll(async () => {
    await disconnectTestDatabase(client);
  });

  it('should store every observation with the exact decimal text published by the source when upserting', async () => {
    await expect(repository.upsertMany(TRADE_POLICY_UNCERTAINTY, await recordedFredObservations('EPUTRADE', '2026-06-01-to-2026-09-24'))).resolves.toBe(2);

    await expect(storedRows(client)).resolves.toEqual([
      { source: 'fred', code: 'EPUTRADE', date: '2026-06-01', value: '1230.8591361576214' },
      { source: 'fred', code: 'EPUTRADE', date: '2026-07-01', value: '1248.2368946779902' },
    ]);
  });

  it('should update the value without duplicating when the same observation is fetched again', async () => {
    const observations = await recordedSgsObservations('27574', '2026-06-01-to-2026-09-24');
    await repository.upsertMany(BRAZIL_COMMODITIES_INDEX, observations);

    await repository.upsertMany(BRAZIL_COMMODITIES_INDEX, observations.map((observation) => (observation.date.toString() === '2026-08-01' ? { ...observation, value: '456.3' } : observation)));

    const rows = await storedRows(client);
    expect(rows.map((row) => `${row.date} ${row.value}`)).toEqual(['2026-06-01 442.88', '2026-07-01 440.36', '2026-08-01 456.3']);
  });

  it('should return zero without touching the table when there are no observations', async () => {
    await expect(repository.upsertMany(US_IMPORTS_FROM_BRAZIL, [])).resolves.toBe(0);
    await expect(storedRows(client)).resolves.toEqual([]);
  });

  it('should return the most recent observation of each indicator keyed by its id when observations exist', async () => {
    await repository.upsertMany(US_IMPORTS_FROM_BRAZIL, await recordedFredObservations('IMP3510', '2024-01-01-to-2026-09-24'));
    await repository.upsertMany(BRAZIL_COMMODITIES_INDEX, await recordedSgsObservations('27574', '2026-06-01-to-2026-09-24'));

    const latest = await repository.findLatestPerIndicator();

    expect(new Map(latest)).toEqual(
      new Map([
        ['fred/IMP3510', { date: CalendarDate.fromIso('2026-07-01'), value: '3387.521714' }],
        ['sgs/27574', { date: CalendarDate.fromIso('2026-08-01'), value: '456.24' }],
      ]),
    );
  });

  it('should return the observations of one indicator inside the inclusive period in chronological order', async () => {
    await repository.upsertMany(US_IMPORTS_FROM_BRAZIL, await recordedFredObservations('IMP3510', '2024-01-01-to-2026-09-24'));
    await repository.upsertMany(TRADE_POLICY_UNCERTAINTY, await recordedFredObservations('EPUTRADE', '2026-06-01-to-2026-09-24'));

    const observations = await repository.findBetween(US_IMPORTS_FROM_BRAZIL, CalendarDate.fromIso('2026-05-01'), CalendarDate.fromIso('2026-07-01'));

    expect(observations).toEqual([
      { date: CalendarDate.fromIso('2026-05-01'), value: '3235.299191' },
      { date: CalendarDate.fromIso('2026-06-01'), value: '3133.627619' },
      { date: CalendarDate.fromIso('2026-07-01'), value: '3387.521714' },
    ]);
  });

  it('should list the years with observations from the most recent and the months with observations of each year', async () => {
    await repository.upsertMany(BRAZIL_COMMODITIES_INDEX, await recordedSgsObservations('27574', '2024-01-01-to-2024-12-31'));
    await repository.upsertMany(BRAZIL_COMMODITIES_INDEX, await recordedSgsObservations('27574', '2026-06-01-to-2026-09-24'));
    await repository.upsertMany(US_IMPORTS_FROM_BRAZIL, await recordedFredObservations('IMP3510', '2026-06-01-to-2026-09-24'));

    await expect(repository.findAvailablePeriods(BRAZIL_COMMODITIES_INDEX)).resolves.toEqual([
      { year: 2026, months: [6, 7, 8] },
      { year: 2024, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    ]);
  });

  it('should return the observations of the last twelve months of each indicator counted from its latest one, oldest first', async () => {
    await repository.upsertMany(US_IMPORTS_FROM_BRAZIL, await recordedFredObservations('IMP3510', '2024-01-01-to-2026-09-24'));
    await repository.upsertMany(BRAZIL_COMMODITIES_INDEX, await recordedSgsObservations('27574', '2026-06-01-to-2026-09-24'));

    const recent = await repository.findRecentPerIndicator(12);

    const usImports = recent.get('fred/IMP3510') ?? [];
    expect(usImports).toHaveLength(13);
    expect([usImports[0], usImports.at(-1)]).toEqual([
      { date: CalendarDate.fromIso('2025-07-01'), value: '4034.777901' },
      { date: CalendarDate.fromIso('2026-07-01'), value: '3387.521714' },
    ]);
    expect(recent.get('sgs/27574')?.map((observation) => observation.date.toString())).toEqual(['2026-06-01', '2026-07-01', '2026-08-01']);
  });
});
