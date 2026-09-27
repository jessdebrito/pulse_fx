export type FavoriteKind = 'currency' | 'indicator';

export interface Favorite {
  readonly kind: FavoriteKind;
  readonly key: string;
}

export interface FavoritesDto {
  readonly currencies: readonly string[];
  readonly indicators: readonly string[];
}
