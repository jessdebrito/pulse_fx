import { useCallback, useState } from 'react';
import type { FavoriteItem, Favorites, FavoritesClient } from '../api/favorites';
import { isFavorite, NO_FAVORITES, withFavorite, withoutFavorite } from '../lib/favorites';
import { useAsync } from './use-async';

export interface FavoritesView {
  readonly status: 'loading' | 'ready' | 'error';
  readonly favorites: Favorites;
  readonly saveFailed: boolean;
  readonly isFavorite: (item: FavoriteItem) => boolean;
  readonly toggle: (item: FavoriteItem) => void;
}

export function useFavorites(client: FavoritesClient): FavoritesView {
  const loadFavorites = useCallback(() => client.list(), [client]);
  const loaded = useAsync(loadFavorites);
  const [changed, setChanged] = useState<Favorites | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const favorites = changed ?? (loaded.status === 'ready' ? loaded.data : NO_FAVORITES);

  const toggle = useCallback(
    (item: FavoriteItem): void => {
      const marked = isFavorite(favorites, item);
      setChanged(marked ? withoutFavorite(favorites, item) : withFavorite(favorites, item));
      setSaveFailed(false);
      const saving = marked ? client.remove(item) : client.add(item);
      void saving.catch(() => {
        setChanged(favorites);
        setSaveFailed(true);
      });
    },
    [client, favorites],
  );

  return { status: loaded.status, favorites, saveFailed, isFavorite: (item) => isFavorite(favorites, item), toggle };
}
