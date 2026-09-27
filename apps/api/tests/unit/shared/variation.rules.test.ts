import type { CurrencyQuote } from '../../../src/modules/currencies';
import { CalendarDate } from '../../../src/shared/calendar-date';
import { DAILY_VARIATION_RULE, YEAR_OVER_YEAR_VARIATION_RULE } from '../../../src/shared/variation.constants';
import { calculateVariation, toVariationDto, type DatedValue } from '../../../src/shared/variation.rules';
import type { IndicatorObservation } from '../../../src/modules/indicators';
import { recordedSgsObservations } from '../../support/sources/bcb-sgs/recorded-data';
import { recordedQuotes } from '../../support/sources/bcb-ptax/recorded-data';
import { recordedFredObservations } from '../../support/sources/fred/recorded-data';

const day = (iso: string): CalendarDate => CalendarDate.fromIso(iso);

function closingsOf(quotes: readonly CurrencyQuote[]): DatedValue[] {
  return quotes.filter((quote) => quote.bulletin === 'closing').map((quote) => ({ date: quote.quoteDate, value: quote.ask }));
}

function valuesOf(observations: readonly IndicatorObservation[]): DatedValue[] {
  return observations.map((observation) => ({ date: observation.date, value: Number(observation.value) }));
}

async function usdClosingsOfSeptember(): Promise<DatedValue[]> {
  return closingsOf(await recordedQuotes('USD', '2026-09-01-to-2026-09-25'));
}

describe('calculateVariation with the business days rule', () => {
  it('should compare the latest PTAX closing with the closing five business days before', async () => {
    const variation = calculateVariation(await usdClosingsOfSeptember(), DAILY_VARIATION_RULE);

    expect(variation).toMatchObject({
      latest: { date: day('2026-09-25'), value: 5.1991 },
      base: { date: day('2026-09-18'), value: 5.1575 },
      rule: { kind: 'observations', count: 5 },
    });
    expect(variation?.percent).toBeCloseTo(0.8066, 4);
    expect(variation?.absoluteChange).toBeCloseTo(0.0416, 4);
  });

  it('should skip holidays and weekends because only published closings count as business days', async () => {
    const untilSeptember11 = (await usdClosingsOfSeptember()).filter((point) => !day('2026-09-11').isBefore(point.date));

    const variation = calculateVariation(untilSeptember11, DAILY_VARIATION_RULE);

    expect(variation?.base).toEqual({ date: day('2026-09-03'), value: 5.0962 });
    expect(variation?.percent).toBeCloseTo(-0.0863, 4);
  });

  it('should return null when there are fewer closings than the rule needs', async () => {
    const firstFive = (await usdClosingsOfSeptember()).slice(0, 5);

    expect(calculateVariation(firstFive, DAILY_VARIATION_RULE)).toBeNull();
  });

  it('should return null when the base closing is zero', async () => {
    const withZeroBase = (await usdClosingsOfSeptember()).map((point) => (point.date.equals(day('2026-09-18')) ? { ...point, value: 0 } : point));

    expect(calculateVariation(withZeroBase, DAILY_VARIATION_RULE)).toBeNull();
  });
});

describe('calculateVariation with the twelve months rule', () => {
  it('should compare the latest month with the same month twelve months before', async () => {
    const usImports = valuesOf(await recordedFredObservations('IMP3510', '2024-01-01-to-2026-09-24'));

    const variation = calculateVariation(usImports, YEAR_OVER_YEAR_VARIATION_RULE);

    expect(variation).toMatchObject({
      latest: { date: day('2026-07-01'), value: 3387.521714 },
      base: { date: day('2025-07-01'), value: 4034.777901 },
      rule: { kind: 'months', count: 12 },
    });
    expect(variation?.percent).toBeCloseTo(-16.0419, 4);
  });

  it('should compare a quarterly series with the same quarter of the previous year', async () => {
    const customsDuties = valuesOf(await recordedFredObservations('B235RC1Q027SBEA', '2024-01-01-to-2026-09-24'));

    const variation = calculateVariation(customsDuties, YEAR_OVER_YEAR_VARIATION_RULE);

    expect(variation?.base).toEqual({ date: day('2025-04-01'), value: 267.681 });
    expect(variation?.percent).toBeCloseTo(21.9078, 4);
  });

  it('should return null instead of using a neighbor month when the month twelve months before is missing', async () => {
    const withoutJuly2025 = valuesOf(await recordedFredObservations('IMP3510', '2024-01-01-to-2026-09-24')).filter((point) => !point.date.equals(day('2025-07-01')));

    expect(calculateVariation(withoutJuly2025, YEAR_OVER_YEAR_VARIATION_RULE)).toBeNull();
  });

  it('should return null when the series does not reach twelve months back', async () => {
    const commoditiesSinceJune = valuesOf(await recordedSgsObservations('27574', '2026-06-01-to-2026-09-24'));

    expect(calculateVariation(commoditiesSinceJune, YEAR_OVER_YEAR_VARIATION_RULE)).toBeNull();
  });
});

describe('calculateVariation edge cases', () => {
  it.each([
    ['there are no observations', 0],
    ['there is a single observation', 1],
  ])('should return null when %s', async (_case, size) => {
    const points = (await usdClosingsOfSeptember()).slice(0, size);

    expect(calculateVariation(points, DAILY_VARIATION_RULE)).toBeNull();
    expect(calculateVariation(points, YEAR_OVER_YEAR_VARIATION_RULE)).toBeNull();
  });
});

describe('toVariationDto', () => {
  it('should expose the latest and base observations with ISO dates and the rule used', async () => {
    const dto = toVariationDto(calculateVariation(await usdClosingsOfSeptember(), DAILY_VARIATION_RULE));

    expect(dto).toMatchObject({
      latestDate: '2026-09-25',
      latestValue: 5.1991,
      baseDate: '2026-09-18',
      baseValue: 5.1575,
      rule: { kind: 'observations', count: 5 },
    });
    expect(dto?.percent).toBeCloseTo(0.8066, 4);
  });

  it('should return null when there is no variation', () => {
    expect(toVariationDto(null)).toBeNull();
  });
});
