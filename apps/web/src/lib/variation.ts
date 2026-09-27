import type { IndicatorFrequency } from '../api/indicators';
import type { Variation, VariationRule } from '../api/schemas';
import { formatIndicatorValue, formatPercent, formatQuoteValue, formatReferenceDate } from './format';

export interface VariationFormat {
  readonly value: (value: number) => string;
  readonly date: (date: string) => string;
}

const NO_BASE_TEXT = 'Variação: sem base de comparação.';
const PERCENT_DISPLAY_SCALE = 100;

export const CURRENCY_VARIATION_FORMAT: VariationFormat = Object.freeze({
  value: formatQuoteValue,
  date: (date: string): string => formatReferenceDate(date, 'daily'),
});

export function indicatorVariationFormat(frequency: IndicatorFrequency): VariationFormat {
  return { value: formatIndicatorValue, date: (date) => formatReferenceDate(date, frequency) };
}

const OBSERVATION_UNITS: Readonly<Partial<Record<IndicatorFrequency, string>>> = {
  daily: 'dias úteis',
  weekly: 'semanas',
};

export function variationBasisLabel(rule: VariationRule, frequency: IndicatorFrequency): string {
  if (rule.kind === 'months') return `${rule.count} meses`;
  return `${rule.count} ${OBSERVATION_UNITS[frequency] ?? 'observações'}`;
}

export function describeVariation(variation: Variation | null, frequency: IndicatorFrequency, format: VariationFormat): string {
  if (variation === null) return NO_BASE_TEXT;
  const basis = variationBasisLabel(variation.rule, frequency);
  const base = `${format.value(variation.baseValue)} em ${format.date(variation.baseDate)}`;
  const latest = `${format.value(variation.latestValue)} em ${format.date(variation.latestDate)}`;
  return `Variação (${basis}): ${formatPercent(variation.percent)} — de ${base} para ${latest}`;
}

export type VariationTone = 'positive' | 'negative' | 'neutral';

export function variationTone(percent: number): VariationTone {
  const shown = Math.sign(percent) * Math.round(Math.abs(percent) * PERCENT_DISPLAY_SCALE);
  if (shown > 0) return 'positive';
  if (shown < 0) return 'negative';
  return 'neutral';
}

export function describeVariationBase(variation: Variation, format: VariationFormat): string {
  return `vs ${format.value(variation.baseValue)} em ${format.date(variation.baseDate)}`;
}
