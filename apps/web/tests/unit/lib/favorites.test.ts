import { favoriteCurrencies, favoriteIndicators, isFavorite, NO_FAVORITES, withFavorite, withoutFavorite } from '../../../src/lib/favorites';
import { recordedCurrencySummaries } from '../../support/api/recorded-currencies';
import { recordedFavorites } from '../../support/api/recorded-favorites';
import { recordedIndicatorSummaries } from '../../support/api/recorded-indicators';

const favorites = recordedFavorites();

describe('isFavorite', () => {
  it.each([
    [{ kind: 'currency', code: 'USD' }, true],
    [{ kind: 'currency', code: 'AUD' }, false],
    [{ kind: 'indicator', source: 'fred', code: 'IMP3510' }, true],
    [{ kind: 'indicator', source: 'fred', code: 'EPUTRADE' }, false],
  ] as const)('should say whether %p is a favorite', (item, expected) => {
    expect(isFavorite(favorites, item)).toBe(expected);
  });
});

describe('withFavorite', () => {
  it('should add the item in order without duplicating it', () => {
    const withAud = withFavorite(favorites, { kind: 'currency', code: 'AUD' });

    expect(withAud.currencies).toEqual(['AUD', 'EUR', 'USD']);
    expect(withFavorite(withAud, { kind: 'currency', code: 'AUD' })).toEqual(withAud);
    expect(withFavorite(favorites, { kind: 'indicator', source: 'fred', code: 'EPUTRADE' }).indicators).toEqual(['fred/EPUTRADE', 'fred/IMP3510', 'sgs/27574']);
  });
});

describe('withoutFavorite', () => {
  it('should remove only the given item', () => {
    expect(withoutFavorite(favorites, { kind: 'indicator', source: 'sgs', code: '27574' })).toEqual({ currencies: ['EUR', 'USD'], indicators: ['fred/IMP3510'] });
  });
});

describe('favoriteCurrencies', () => {
  it('should keep only the favorite currencies in the original order', () => {
    expect(favoriteCurrencies(recordedCurrencySummaries(), favorites).map((currency) => currency.code)).toEqual(['EUR', 'USD']);
  });

  it('should return no currencies when there are no favorites', () => {
    expect(favoriteCurrencies(recordedCurrencySummaries(), NO_FAVORITES)).toEqual([]);
  });
});

describe('favoriteIndicators', () => {
  it('should keep only the favorite indicators in the original order', () => {
    expect(favoriteIndicators(recordedIndicatorSummaries(), favorites).map((indicator) => `${indicator.source}/${indicator.code}`)).toEqual(['fred/IMP3510', 'sgs/27574']);
  });
});
