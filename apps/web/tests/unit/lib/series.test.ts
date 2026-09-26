import { hasValues, toClosingSeries, variationPercent } from '../../../src/lib/series';
import { recordedUsdQuotes } from '../../support/api/recorded-currencies';

const quotes = recordedUsdQuotes().quotes;
const SEPTEMBER_2026 = { granularity: 'month', year: 2026, month: 9 } as const;
const YEAR_2026 = { granularity: 'year', year: 2026 } as const;

describe('toClosingSeries', () => {
  it('should place the closing of the last business day of each month on a January to December axis when annual', () => {
    const series = toClosingSeries(quotes, YEAR_2026);

    expect(series.labels).toEqual(['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']);
    expect(series.datasets.map((dataset) => [dataset.id, dataset.label])).toEqual([
      ['ask', 'Venda'],
      ['bid', 'Compra'],
    ]);
    expect(series.datasets[0]?.values).toEqual([null, null, null, null, null, null, null, null, 5.1991, null, null, null]);
    expect(series.datasets[1]?.values[8]).toBe(5.1985);
  });

  it('should place the closing of each day on a day by day axis of the month when monthly', () => {
    const series = toClosingSeries(quotes, SEPTEMBER_2026);

    expect(series.labels).toHaveLength(30);
    expect(series.labels.slice(0, 3)).toEqual(['1', '2', '3']);
    const ask = series.datasets[0]?.values ?? [];
    expect(ask[23]).toBe(5.1795);
    expect(ask[24]).toBe(5.1991);
    expect(ask.filter((value) => value !== null)).toEqual([5.1795, 5.1991]);
  });

  it('should ignore opening and intermediate bulletins when building the series', () => {
    const series = toClosingSeries(
      quotes.filter((quote) => quote.bulletin !== 'closing'),
      SEPTEMBER_2026,
    );

    expect(hasValues(series)).toBe(false);
  });
});

describe('hasValues', () => {
  it('should be true when at least one point has a value', () => {
    expect(hasValues(toClosingSeries(quotes, YEAR_2026))).toBe(true);
  });
});

describe('variationPercent', () => {
  it('should compare the last value against the first ignoring days without data', () => {
    expect(variationPercent([null, 5.1795, null, 5.1991, null])).toBeCloseTo(0.3784, 4);
  });

  it.each([
    ['no values', []],
    ['a single value', [null, 5.1991, null]],
    ['a zero base', [0, 5.1991]],
  ])('should return null when the series has %s', (_case, values) => {
    expect(variationPercent(values)).toBeNull();
  });
});
