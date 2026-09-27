import type { CurrencySummary } from '../api/currencies';
import type { FavoriteItem, Favorites } from '../api/favorites';
import type { IndicatorSummary } from '../api/indicators';

export const NO_FAVORITES: Favorites = Object.freeze({ currencies: [], indicators: [] });

type FavoriteList = keyof Favorites;

export function currencyFavorite(currency: Pick<CurrencySummary, 'code'>): FavoriteItem {
  return { kind: 'currency', code: currency.code };
}

export function indicatorFavorite(indicator: Pick<IndicatorSummary, 'source' | 'code'>): FavoriteItem {
  return { kind: 'indicator', source: indicator.source, code: indicator.code };
}

export function isFavorite(favorites: Favorites, item: FavoriteItem): boolean {
  const [list, key] = locate(item);
  return favorites[list].includes(key);
}

export function withFavorite(favorites: Favorites, item: FavoriteItem): Favorites {
  const [list, key] = locate(item);
  if (favorites[list].includes(key)) return favorites;
  return { ...favorites, [list]: [...favorites[list], key].sort() };
}

export function withoutFavorite(favorites: Favorites, item: FavoriteItem): Favorites {
  const [list, key] = locate(item);
  return { ...favorites, [list]: favorites[list].filter((existing) => existing !== key) };
}

export function favoriteCurrencies(currencies: readonly CurrencySummary[], favorites: Favorites): CurrencySummary[] {
  return currencies.filter((currency) => isFavorite(favorites, currencyFavorite(currency)));
}

export function favoriteIndicators(indicators: readonly IndicatorSummary[], favorites: Favorites): IndicatorSummary[] {
  return indicators.filter((indicator) => isFavorite(favorites, indicatorFavorite(indicator)));
}

function locate(item: FavoriteItem): [FavoriteList, string] {
  return item.kind === 'currency' ? ['currencies', item.code] : ['indicators', `${item.source}/${item.code}`];
}
