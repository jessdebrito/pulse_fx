import { formatIndicatorValue, formatQuoteValue, formatReferenceDate } from '../../../src/lib/format';
import { describeVariation, describeVariationBase, describeVariationPercent, variationBasisLabel, type VariationFormat } from '../../../src/lib/variation';
import { recordedCurrency } from '../../support/api/recorded-currencies';
import { recordedIndicator } from '../../support/api/recorded-indicators';

const CURRENCY_FORMAT: VariationFormat = { value: formatQuoteValue, date: (date) => formatReferenceDate(date, 'daily') };
const MONTHLY_FORMAT: VariationFormat = { value: formatIndicatorValue, date: (date) => formatReferenceDate(date, 'monthly') };

function variationOf<T extends { readonly variation: unknown }>(item: T): NonNullable<T['variation']> {
  if (item.variation === null || item.variation === undefined) throw new Error('The recorded item has no variation');
  return item.variation;
}

describe('variationBasisLabel', () => {
  it.each([
    [{ kind: 'observations', count: 5 }, 'daily', '5 dias úteis'],
    [{ kind: 'observations', count: 4 }, 'weekly', '4 semanas'],
    [{ kind: 'months', count: 12 }, 'monthly', '12 meses'],
    [{ kind: 'months', count: 12 }, 'quarterly', '12 meses'],
  ] as const)('should describe %p of a %s series as %p', (rule, frequency, label) => {
    expect(variationBasisLabel(rule, frequency)).toBe(label);
  });
});

describe('describeVariation', () => {
  it('should name the rule and show the percent with the base and latest closings of a currency', () => {
    expect(describeVariation(variationOf(recordedCurrency('USD')), 'daily', CURRENCY_FORMAT)).toBe(
      'Variação (5 dias úteis): +0,81% — de 5,1575 em 18/09/2026 para 5,1991 em 25/09/2026',
    );
  });

  it('should compare the same month of the previous year for a monthly indicator', () => {
    expect(describeVariation(variationOf(recordedIndicator('fred', 'IMP3510')), 'monthly', MONTHLY_FORMAT)).toBe(
      'Variação (12 meses): -16,04% — de 4.034,78 em jul/2025 para 3.387,52 em jul/2026',
    );
  });

  it('should say there is no comparison base when the variation is missing', () => {
    expect(describeVariation(null, 'daily', CURRENCY_FORMAT)).toBe('Variação: sem base de comparação.');
  });
});

describe('describeVariationBase', () => {
  it('should show the base value and its date as the explicit denominator', () => {
    expect(describeVariationBase(variationOf(recordedCurrency('USD')), CURRENCY_FORMAT)).toBe('vs 5,1575 em 18/09/2026');
    expect(describeVariationBase(variationOf(recordedIndicator('fred', 'IMP3510')), MONTHLY_FORMAT)).toBe('vs 4.034,78 em jul/2025');
  });
});

describe('describeVariationPercent', () => {
  it('should show the percent followed by the period of the rule', () => {
    expect(describeVariationPercent(variationOf(recordedCurrency('USD')), 'daily')).toBe('+0,81% em 5 dias úteis');
    expect(describeVariationPercent(variationOf(recordedIndicator('fred', 'IMP3510')), 'monthly')).toBe('-16,04% em 12 meses');
  });
});
