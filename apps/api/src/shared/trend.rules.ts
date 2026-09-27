import type { DatedValue } from './variation.rules';

export interface TrendPointDto {
  readonly date: string;
  readonly value: number;
}

export function toTrendDto(points: readonly DatedValue[]): TrendPointDto[] {
  return points.map((point) => ({ date: point.date.toString(), value: point.value }));
}
