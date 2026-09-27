import { IndicatorNotFoundError, IndicatorsService, type IndicatorKey } from '../../../../src/modules/indicators';
import { CalendarDate } from '../../../../src/shared/calendar-date';
import { InMemoryIndicatorObservationRepository, InMemoryIndicatorRepository } from '../../../support/in-memory/indicators';
import { recordedSgsIndicator, recordedSgsObservations } from '../../../support/sources/bcb-sgs/recorded-data';
import { recordedFredIndicator, recordedFredObservations } from '../../../support/sources/fred/recorded-data';

const US_IMPORTS_FROM_BRAZIL: IndicatorKey = { source: 'fred', code: 'IMP3510' };
const TRADE_POLICY_UNCERTAINTY: IndicatorKey = { source: 'fred', code: 'EPUTRADE' };
const BRAZIL_COMMODITIES_INDEX: IndicatorKey = { source: 'sgs', code: '27574' };
const UNKNOWN: IndicatorKey = { source: 'fred', code: 'UNKNOWN' };
const START_OF_2026 = CalendarDate.fromIso('2026-01-01');
const TODAY = CalendarDate.fromIso('2026-09-24');

async function serviceWithRecordedData(): Promise<IndicatorsService> {
  const indicators = new InMemoryIndicatorRepository();
  const observations = new InMemoryIndicatorObservationRepository();
  await indicators.upsert(await recordedSgsIndicator('27574'));
  await indicators.upsert(await recordedFredIndicator('IMP3510'));
  await indicators.upsert(await recordedFredIndicator('EPUTRADE'));
  await observations.upsertMany(US_IMPORTS_FROM_BRAZIL, await recordedFredObservations('IMP3510', '2024-01-01-to-2026-09-24'));
  await observations.upsertMany(BRAZIL_COMMODITIES_INDEX, await recordedSgsObservations('27574', '2026-06-01-to-2026-09-24'));
  return new IndicatorsService({ indicators, observations });
}

describe('IndicatorsService.listWithLatestObservation', () => {
  it('should list every indicator ordered by source and code with its most recent observation', async () => {
    const service = await serviceWithRecordedData();

    const summaries = await service.listWithLatestObservation();

    expect(summaries.map((summary) => `${summary.source}/${summary.code}`)).toEqual(['fred/EPUTRADE', 'fred/IMP3510', 'sgs/27574']);
    expect(summaries.find((summary) => summary.code === 'IMP3510')).toEqual({
      source: 'fred',
      code: 'IMP3510',
      name: 'U.S. Imports of Goods by Customs Basis from Brazil',
      unit: 'Millions of Dollars',
      frequency: 'monthly',
      latestObservation: { date: '2026-07-01', value: 3387.521714 },
      variation: {
        percent: expect.closeTo(-16.0419, 4) as number,
        absoluteChange: expect.closeTo(-647.256187, 6) as number,
        latestDate: '2026-07-01',
        latestValue: 3387.521714,
        baseDate: '2025-07-01',
        baseValue: 4034.777901,
        rule: { kind: 'months', count: 12 },
      },
    });
    expect(summaries.find((summary) => summary.code === '27574')?.latestObservation).toEqual({ date: '2026-08-01', value: 456.24 });
  });

  it('should have no variation when the month twelve months before the latest one is not stored', async () => {
    const service = await serviceWithRecordedData();

    const summaries = await service.listWithLatestObservation();

    expect(summaries.find((summary) => summary.code === '27574')?.variation).toBeNull();
  });

  it('should keep the indicator with a null latest observation when it has no observations yet', async () => {
    const service = await serviceWithRecordedData();

    const summaries = await service.listWithLatestObservation();

    expect(summaries.find((summary) => summary.code === 'EPUTRADE')).toMatchObject({ latestObservation: null, variation: null });
  });

  it('should return an empty list when the catalog is empty', async () => {
    const service = new IndicatorsService({ indicators: new InMemoryIndicatorRepository(), observations: new InMemoryIndicatorObservationRepository() });

    await expect(service.listWithLatestObservation()).resolves.toEqual([]);
  });
});

describe('IndicatorsService.getObservations', () => {
  it('should return the observations inside the period in chronological order with the indicator details', async () => {
    const service = await serviceWithRecordedData();

    const history = await service.getObservations(US_IMPORTS_FROM_BRAZIL, CalendarDate.fromIso('2026-05-01'), TODAY);

    expect(history).toEqual({
      source: 'fred',
      code: 'IMP3510',
      name: 'U.S. Imports of Goods by Customs Basis from Brazil',
      unit: 'Millions of Dollars',
      frequency: 'monthly',
      from: '2026-05-01',
      to: '2026-09-24',
      observations: [
        { date: '2026-05-01', value: 3235.299191 },
        { date: '2026-06-01', value: 3133.627619 },
        { date: '2026-07-01', value: 3387.521714 },
      ],
    });
  });

  it('should return an empty list when the indicator has no observations in the period', async () => {
    const service = await serviceWithRecordedData();

    await expect(service.getObservations(TRADE_POLICY_UNCERTAINTY, START_OF_2026, TODAY)).resolves.toMatchObject({ code: 'EPUTRADE', observations: [] });
  });

  it('should throw IndicatorNotFoundError when the indicator is not in the catalog', async () => {
    const service = await serviceWithRecordedData();

    await expect(service.getObservations(UNKNOWN, START_OF_2026, TODAY)).rejects.toThrow(IndicatorNotFoundError);
  });
});

describe('IndicatorsService.getAvailablePeriods', () => {
  it('should list the years with observations from the most recent and the months with observations of each year', async () => {
    const service = await serviceWithRecordedData();

    await expect(service.getAvailablePeriods(US_IMPORTS_FROM_BRAZIL)).resolves.toEqual({
      source: 'fred',
      code: 'IMP3510',
      periods: [
        { year: 2026, months: [1, 2, 3, 4, 5, 6, 7] },
        { year: 2025, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
        { year: 2024, months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
      ],
    });
  });

  it('should return no periods when the indicator has no observations yet', async () => {
    const service = await serviceWithRecordedData();

    await expect(service.getAvailablePeriods(TRADE_POLICY_UNCERTAINTY)).resolves.toEqual({ source: 'fred', code: 'EPUTRADE', periods: [] });
  });

  it('should throw IndicatorNotFoundError when the indicator is not in the catalog', async () => {
    const service = await serviceWithRecordedData();

    await expect(service.getAvailablePeriods(UNKNOWN)).rejects.toThrow(IndicatorNotFoundError);
  });
});
