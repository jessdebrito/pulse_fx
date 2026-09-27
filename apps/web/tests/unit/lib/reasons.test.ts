import { currencyReason, indicatorReason } from '../../../src/lib/reasons';
import { recordedCurrencySummaries } from '../../support/api/recorded-currencies';
import { recordedIndicatorSummaries } from '../../support/api/recorded-indicators';

describe('currencyReason', () => {
  it('should explain why the dollar PTAX matters', () => {
    expect(currencyReason('USD')).toMatch(/^A PTAX do dólar é a taxa de referência oficial do BCB/);
  });

  it('should have a reason for every currency of the PTAX catalog', () => {
    expect(recordedCurrencySummaries().filter((currency) => currencyReason(currency.code) === null)).toEqual([]);
  });

  it('should return null for a currency outside the catalog', () => {
    expect(currencyReason('XYZ')).toBeNull();
  });
});

describe('indicatorReason', () => {
  it('should explain why the US imports from Brazil matter', () => {
    expect(indicatorReason({ source: 'fred', code: 'IMP3510' })).toMatch(/^Mede quanto o Brasil vende aos EUA/);
  });

  it('should have a reason for every tracked indicator', () => {
    expect(recordedIndicatorSummaries().filter((indicator) => indicatorReason(indicator) === null).map((indicator) => indicator.code)).toEqual([]);
  });

  it('should return null for an indicator that is not tracked', () => {
    expect(indicatorReason({ source: 'sgs', code: '99999' })).toBeNull();
  });
});
