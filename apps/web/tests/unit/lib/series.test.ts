import { hasValues, toClosingSeries, toIndicatorSeries } from '../../../src/lib/series';
import { recordedUsdQuotes } from '../../support/api/recorded-currencies';
import { recordedCustomsDutiesObservations, recordedUsImportsFromBrazilObservations } from '../../support/api/recorded-indicators';

const quotes = recordedUsdQuotes().quotes;
const SEPTEMBER_2026 = { granularity: 'month', year: 2026, month: 9 } as const;
const YEAR_2026 = { granularity: 'year', year: 2026 } as const;
const USD_WINDOW = { granularity: 'window', window: { unit: 'day', length: 90 }, from: '2026-06-28', to: '2026-09-25' } as const;
const TWENTY_FOUR_MONTHS = { unit: 'month', length: 24 } as const;

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

  it('should place the closing of each day on a day by day axis of the whole window when the selection is a daily window', () => {
    const series = toClosingSeries(quotes, USD_WINDOW);

    expect(series.labels).toHaveLength(90);
    const ask = series.datasets[0]?.values ?? [];
    expect([ask[88], ask[89]]).toEqual([5.1795, 5.1991]);
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

describe('toIndicatorSeries', () => {
  const usImports = recordedUsImportsFromBrazilObservations().observations;

  it('should place each monthly observation on a January to December axis when annual', () => {
    const series = toIndicatorSeries(usImports, YEAR_2026, 'Importações dos EUA vindas do Brasil');

    expect(series.labels).toEqual(['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']);
    expect(series.datasets).toEqual([
      {
        id: 'value',
        label: 'Importações dos EUA vindas do Brasil',
        values: [2781.650258, 2309.326411, 2974.225395, 2649.202833, 3235.299191, 3133.627619, 3387.521714, null, null, null, null, null],
      },
    ]);
  });

  it('should place every month of the span on the axis when the selection is the full history', () => {
    const series = toIndicatorSeries(usImports, { granularity: 'history', from: '2024-01', to: '2026-07' }, 'Importações');

    expect(series.labels).toHaveLength(31);
    const values = series.datasets[0]?.values ?? [];
    expect(values.every((value) => value !== null)).toBe(true);
    expect([values[0], values.at(-1)]).toEqual([3759.060245, 3387.521714]);
  });

  it('should place each monthly observation of the window on a month by month axis when the selection is a monthly window', () => {
    const series = toIndicatorSeries(usImports, { granularity: 'window', window: TWENTY_FOUR_MONTHS, from: '2024-08-01', to: '2026-07-31' }, 'Importações');

    const values = series.datasets[0]?.values ?? [];
    expect(values).toHaveLength(24);
    expect(values.every((value) => value !== null)).toBe(true);
    expect([values[0], values.at(-1)]).toEqual([3945.545527, 3387.521714]);
  });

  it('should show the last eight quarters when the series is quarterly and the selection is its window', () => {
    const series = toIndicatorSeries(
      recordedCustomsDutiesObservations().observations,
      { granularity: 'window', window: TWENTY_FOUR_MONTHS, from: '2024-05-01', to: '2026-04-30' },
      'Tarifas',
    );

    const values = series.datasets[0]?.values ?? [];
    expect(values).toHaveLength(24);
    expect(values.filter((value) => value !== null)).toEqual([85.865, 87.199, 96.965, 267.681, 331.423, 364.324, 346.15, 326.324]);
  });

  it('should leave the months between quarters empty when the series is quarterly', () => {
    const series = toIndicatorSeries(recordedCustomsDutiesObservations().observations, { granularity: 'history', from: '2024-01', to: '2026-04' }, 'Tarifas');

    const values = series.datasets[0]?.values ?? [];
    expect(values).toHaveLength(28);
    expect(values.filter((value) => value !== null)).toEqual([82.342, 78.941, 85.865, 87.199, 96.965, 267.681, 331.423, 364.324, 346.15, 326.324]);
    expect(values.slice(0, 4)).toEqual([82.342, null, null, 78.941]);
  });
});

describe('hasValues', () => {
  it('should be true when at least one point has a value', () => {
    expect(hasValues(toClosingSeries(quotes, YEAR_2026))).toBe(true);
  });
});
