import type { FavoriteItem, Favorites, FavoritesClient } from '../../../src/api/favorites';

export class InMemoryFavoritesClient implements FavoritesClient {
  readonly added: FavoriteItem[] = [];
  readonly removed: FavoriteItem[] = [];
  failSaves = false;
  failList = false;

  constructor(private favorites: Favorites = { currencies: [], indicators: [] }) {}

  list(): Promise<Favorites> {
    return this.failList ? Promise.reject(new Error('GET /api/favorites responded with HTTP 500')) : Promise.resolve(this.favorites);
  }

  add(item: FavoriteItem): Promise<void> {
    if (this.failSaves) return Promise.reject(new Error('PUT /api/favorites responded with HTTP 500'));
    this.added.push(item);
    this.favorites = changed(this.favorites, item, (keys, key) => [...keys.filter((existing) => existing !== key), key]);
    return Promise.resolve();
  }

  remove(item: FavoriteItem): Promise<void> {
    if (this.failSaves) return Promise.reject(new Error('DELETE /api/favorites responded with HTTP 500'));
    this.removed.push(item);
    this.favorites = changed(this.favorites, item, (keys, key) => keys.filter((existing) => existing !== key));
    return Promise.resolve();
  }
}

function changed(favorites: Favorites, item: FavoriteItem, update: (keys: readonly string[], key: string) => string[]): Favorites {
  if (item.kind === 'currency') return { ...favorites, currencies: update(favorites.currencies, item.code) };
  return { ...favorites, indicators: update(favorites.indicators, `${item.source}/${item.code}`) };
}
