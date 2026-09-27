import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { favoritesSchema, type Favorites } from '../../../src/api/favorites';

export function recordedFavoritesResponse(): unknown {
  return JSON.parse(readFileSync(join(__dirname, '../../fixtures/api/favorites.json'), 'utf8'));
}

export function recordedFavorites(): Favorites {
  return favoritesSchema.parse(recordedFavoritesResponse());
}
