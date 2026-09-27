import type { VariationRule } from './variation.rules';

export const DAILY_VARIATION_RULE: VariationRule = Object.freeze({ kind: 'observations', count: 5 } as const);

export const WEEKLY_VARIATION_RULE: VariationRule = Object.freeze({ kind: 'observations', count: 4 } as const);

export const YEAR_OVER_YEAR_VARIATION_RULE: VariationRule = Object.freeze({ kind: 'months', count: 12 } as const);
