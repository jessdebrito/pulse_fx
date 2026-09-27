import { z } from 'zod';
import { browserFetch, getJson, sendCommand, type FetchFunction } from './http';
import type { IndicatorSource } from './indicators';

export const favoritesSchema = z.object({
  currencies: z.array(z.string()),
  indicators: z.array(z.string()),
});

export type Favorites = z.infer<typeof favoritesSchema>;

export type FavoriteItem =
  | { readonly kind: 'currency'; readonly code: string }
  | { readonly kind: 'indicator'; readonly source: IndicatorSource; readonly code: string };

export interface FavoritesClient {
  list(): Promise<Favorites>;
  add(item: FavoriteItem): Promise<void>;
  remove(item: FavoriteItem): Promise<void>;
}

const FAVORITES_ROUTE = '/api/favorites';
const CLIENT_ID_HEADER = 'X-Client-Id';

export function createFavoritesClient(clientId: string, fetchFunction: FetchFunction = browserFetch): FavoritesClient {
  const headers = { [CLIENT_ID_HEADER]: clientId };
  return {
    list: () => getJson(fetchFunction, FAVORITES_ROUTE, favoritesSchema, { headers }),
    add: (item) => sendCommand(fetchFunction, favoriteUrl(item), { method: 'PUT', headers }),
    remove: (item) => sendCommand(fetchFunction, favoriteUrl(item), { method: 'DELETE', headers }),
  };
}

function favoriteUrl(item: FavoriteItem): string {
  if (item.kind === 'currency') return `${FAVORITES_ROUTE}/currencies/${encodeURIComponent(item.code)}`;
  return `${FAVORITES_ROUTE}/indicators/${item.source}/${encodeURIComponent(item.code)}`;
}
