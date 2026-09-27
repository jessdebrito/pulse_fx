import type { Favorite, FavoriteRepository } from '../../../src/modules/favorites';
import type { ClientId } from '../../../src/shared/client-id';

export class InMemoryFavoriteRepository implements FavoriteRepository {
  private readonly rows = new Map<string, { readonly clientId: string; readonly favorite: Favorite }>();

  findByClient(clientId: ClientId): Promise<Favorite[]> {
    const favorites = [...this.rows.values()].filter((row) => row.clientId === clientId.value).map((row) => row.favorite);
    return Promise.resolve(favorites.sort((left, right) => left.kind.localeCompare(right.kind) || left.key.localeCompare(right.key)));
  }

  add(clientId: ClientId, favorite: Favorite): Promise<void> {
    this.rows.set(rowKey(clientId, favorite), { clientId: clientId.value, favorite });
    return Promise.resolve();
  }

  remove(clientId: ClientId, favorite: Favorite): Promise<void> {
    this.rows.delete(rowKey(clientId, favorite));
    return Promise.resolve();
  }
}

function rowKey(clientId: ClientId, favorite: Favorite): string {
  return `${clientId.value}|${favorite.kind}|${favorite.key}`;
}
