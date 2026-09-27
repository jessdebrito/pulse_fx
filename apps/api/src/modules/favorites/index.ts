export type { Favorite, FavoriteKind, FavoritesDto } from './favorites.types';
export { PrismaFavoriteRepository, type FavoriteRepository } from './favorites.repository';
export { FavoritesService, type FavoritesManager } from './favorites.service';
export { createFavoritesRouter } from './favorites.controller';
