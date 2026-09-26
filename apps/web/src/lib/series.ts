import type { Quote } from '../api/currencies';
import { periodAxis, type PeriodSelection } from './periods';

export interface SeriesDataset {
  readonly id: string;
  readonly label: string;
  readonly values: readonly (number | null)[];
}

export interface TimeSeries {
  readonly labels: readonly string[];
  readonly datasets: readonly SeriesDataset[];
}

const PERCENT = 100;
const MONTH_KEY_LENGTH = 7;

export function toClosingSeries(quotes: readonly Quote[], selection: PeriodSelection): TimeSeries {
  const axis = periodAxis(selection);
  const closingByKey = lastClosingByKey(quotes, selection);
  const valuesOf = (pick: (quote: Quote) => number): (number | null)[] => axis.keys.map((key) => {
    const closing = closingByKey.get(key);
    return closing === undefined ? null : pick(closing);
  });
  return {
    labels: axis.labels,
    datasets: [
      { id: 'ask', label: 'Venda', values: valuesOf((quote) => quote.ask) },
      { id: 'bid', label: 'Compra', values: valuesOf((quote) => quote.bid) },
    ],
  };
}

export function hasValues(series: TimeSeries): boolean {
  return series.datasets.some((dataset) => dataset.values.some((value) => value !== null));
}

export function variationPercent(values: readonly (number | null)[]): number | null {
  const present = values.filter((value): value is number => value !== null);
  const first = present[0];
  const last = present.at(-1);
  if (present.length < 2 || first === undefined || last === undefined || first === 0) return null;
  return ((last - first) / first) * PERCENT;
}

function lastClosingByKey(quotes: readonly Quote[], selection: PeriodSelection): Map<string, Quote> {
  const keyOf = (quote: Quote): string => (selection.granularity === 'year' ? quote.quoteDate.slice(0, MONTH_KEY_LENGTH) : quote.quoteDate);
  const closings = quotes.filter((quote) => quote.bulletin === 'closing').sort((left, right) => left.quotedAt.localeCompare(right.quotedAt));
  return new Map(closings.map((quote) => [keyOf(quote), quote]));
}
