import { DAILY_VARIATION_RULE, WEEKLY_VARIATION_RULE, YEAR_OVER_YEAR_VARIATION_RULE } from '../../shared/variation.constants';
import type { VariationRule } from '../../shared/variation.rules';
import type { IndicatorFrequency, IndicatorKey } from './indicators.types';

const VARIATION_RULE_BY_FREQUENCY: Readonly<Record<IndicatorFrequency, VariationRule>> = Object.freeze({
  daily: DAILY_VARIATION_RULE,
  weekly: WEEKLY_VARIATION_RULE,
  monthly: YEAR_OVER_YEAR_VARIATION_RULE,
  quarterly: YEAR_OVER_YEAR_VARIATION_RULE,
  annual: YEAR_OVER_YEAR_VARIATION_RULE,
});

export function indicatorId(key: IndicatorKey): string {
  return `${key.source}/${key.code}`;
}

export function variationRuleOf(frequency: IndicatorFrequency): VariationRule {
  return VARIATION_RULE_BY_FREQUENCY[frequency];
}
