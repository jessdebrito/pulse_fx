import type { TrendPoint } from '../api/schemas';
import type { VariationFormat } from './variation';

export const SPARKLINE_SIZE = Object.freeze({ width: 100, height: 32, padding: 2 });

const MIN_POINTS = 2;
const COORDINATE_SCALE = 100;
const HALF = 2;

export function sparklinePoints(values: readonly number[]): string {
  if (values.length < MIN_POINTS) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = SPARKLINE_SIZE.width / (values.length - 1);
  return values.map((value, index) => `${round(index * step)},${round(heightOf(value, min, max))}`).join(' ');
}

export function describeTrend(trend: readonly TrendPoint[], format: VariationFormat): string {
  const first = trend[0];
  const last = trend.at(-1);
  if (first === undefined || last === undefined) return '';
  return `Evolução: de ${format.value(first.value)} em ${format.date(first.date)} a ${format.value(last.value)} em ${format.date(last.date)}`;
}

function heightOf(value: number, min: number, max: number): number {
  const { height, padding } = SPARKLINE_SIZE;
  if (max === min) return height / HALF;
  return height - padding - ((value - min) / (max - min)) * (height - HALF * padding);
}

function round(coordinate: number): number {
  return Math.round(coordinate * COORDINATE_SCALE) / COORDINATE_SCALE;
}
