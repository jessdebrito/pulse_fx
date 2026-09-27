import { describeTrend, sparklinePoints } from '../../../src/lib/sparkline';
import { CURRENCY_VARIATION_FORMAT, indicatorVariationFormat } from '../../../src/lib/variation';
import { recordedCurrency } from '../../support/api/recorded-currencies';
import { recordedIndicator } from '../../support/api/recorded-indicators';

describe('sparklinePoints', () => {
  it('should spread the points across the width and put the highest value at the top', () => {
    expect(sparklinePoints([1, 2, 3])).toBe('0,30 50,16 100,2');
    expect(sparklinePoints([3, 1])).toBe('0,2 100,30');
  });

  it('should draw a flat series as a line through the middle', () => {
    expect(sparklinePoints([5.1991, 5.1991])).toBe('0,16 100,16');
  });

  it('should return no points when there are fewer than two values', () => {
    expect(sparklinePoints([5.1991])).toBe('');
    expect(sparklinePoints([])).toBe('');
  });

  it('should keep one point per value of a real trend', () => {
    const values = recordedCurrency('USD').trend.map((point) => point.value);

    expect(sparklinePoints(values).split(' ')).toHaveLength(values.length);
  });
});

describe('describeTrend', () => {
  it('should describe the first and the last point of a currency trend', () => {
    expect(describeTrend(recordedCurrency('USD').trend, CURRENCY_VARIATION_FORMAT)).toBe('Evolução: de 5,1717 em 29/06/2026 a 5,1991 em 25/09/2026');
  });

  it('should describe the first and the last month of a monthly indicator trend', () => {
    expect(describeTrend(recordedIndicator('fred', 'IMP3510').trend, indicatorVariationFormat('monthly'))).toBe('Evolução: de 3.945,55 em ago/2024 a 3.387,52 em jul/2026');
  });

  it('should return an empty text when there is no trend', () => {
    expect(describeTrend([], CURRENCY_VARIATION_FORMAT)).toBe('');
  });
});
