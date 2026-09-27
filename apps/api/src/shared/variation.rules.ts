import type { CalendarDate } from './calendar-date';

export type VariationRule =
  | { readonly kind: 'observations'; readonly count: number }
  | { readonly kind: 'months'; readonly count: number };

export interface DatedValue {
  readonly date: CalendarDate;
  readonly value: number;
}

export interface Variation {
  readonly latest: DatedValue;
  readonly base: DatedValue;
  readonly percent: number;
  readonly absoluteChange: number;
  readonly rule: VariationRule;
}

export interface VariationDto {
  readonly percent: number;
  readonly absoluteChange: number;
  readonly latestDate: string;
  readonly latestValue: number;
  readonly baseDate: string;
  readonly baseValue: number;
  readonly rule: VariationRule;
}

const PERCENT = 100;

export function calculateVariation(points: readonly DatedValue[], rule: VariationRule): Variation | null {
  const latest = points.at(-1);
  if (latest === undefined) return null;
  const base = baseOf(points, latest, rule);
  if (base === undefined || base.value === 0) return null;
  const absoluteChange = latest.value - base.value;
  return { latest, base, percent: (absoluteChange / base.value) * PERCENT, absoluteChange, rule };
}

export function toVariationDto(variation: Variation | null): VariationDto | null {
  if (variation === null) return null;
  return {
    percent: variation.percent,
    absoluteChange: variation.absoluteChange,
    latestDate: variation.latest.date.toString(),
    latestValue: variation.latest.value,
    baseDate: variation.base.date.toString(),
    baseValue: variation.base.value,
    rule: variation.rule,
  };
}

function baseOf(points: readonly DatedValue[], latest: DatedValue, rule: VariationRule): DatedValue | undefined {
  if (rule.kind === 'observations') return points.length > rule.count ? points.at(-1 - rule.count) : undefined;
  const baseDate = latest.date.addMonths(-rule.count);
  return points.find((point) => point.date.equals(baseDate));
}
