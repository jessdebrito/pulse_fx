import type { Quote } from '../api/currencies';
import type { Observation } from '../api/indicators';
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

export function toIndicatorSeries(observations: readonly Observation[], selection: PeriodSelection, label: string): TimeSeries {
  const axis = periodAxis(selection);
  const valueByKey = new Map(observations.map((observation) => [keyOfDate(observation.date, selection), observation.value]));
  return {
    labels: axis.labels,
    datasets: [{ id: 'value', label, values: axis.keys.map((key) => valueByKey.get(key) ?? null) }],
  };
}

export function hasValues(series: TimeSeries): boolean {
  return series.datasets.some((dataset) => dataset.values.some((value) => value !== null));
}

function lastClosingByKey(quotes: readonly Quote[], selection: PeriodSelection): Map<string, Quote> {
  const closings = quotes.filter((quote) => quote.bulletin === 'closing').sort((left, right) => left.quotedAt.localeCompare(right.quotedAt));
  return new Map(closings.map((quote) => [keyOfDate(quote.quoteDate, selection), quote]));
}

function keyOfDate(date: string, selection: PeriodSelection): string {
  return selection.granularity === 'month' ? date : date.slice(0, MONTH_KEY_LENGTH);
}
