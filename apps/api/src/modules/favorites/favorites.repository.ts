import type { Database } from '../../database/client';
import type { ClientId } from '../../shared/client-id';
import type { Favorite } from './favorites.types';

export interface FavoriteRepository {
  findByClient(clientId: ClientId): Promise<Favorite[]>;
  add(clientId: ClientId, favorite: Favorite): Promise<void>;
  remove(clientId: ClientId, favorite: Favorite): Promise<void>;
}

export class PrismaFavoriteRepository implements FavoriteRepository {
  constructor(private readonly prisma: Database) {}

  async findByClient(clientId: ClientId): Promise<Favorite[]> {
    const rows = await this.prisma.favorite.findMany({
      where: { clientId: clientId.value },
      select: { kind: true, itemKey: true },
      orderBy: [{ kind: 'asc' }, { itemKey: 'asc' }],
    });
    return rows.map((row) => ({ kind: row.kind, key: row.itemKey }));
  }

  async add(clientId: ClientId, favorite: Favorite): Promise<void> {
    const key = { clientId: clientId.value, kind: favorite.kind, itemKey: favorite.key };
    await this.prisma.favorite.upsert({ where: { clientId_kind_itemKey: key }, create: key, update: {} });
  }

  async remove(clientId: ClientId, favorite: Favorite): Promise<void> {
    await this.prisma.favorite.deleteMany({ where: { clientId: clientId.value, kind: favorite.kind, itemKey: favorite.key } });
  }
}
