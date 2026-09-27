import type { ClientId } from '../../shared/client-id';
import { CurrencyNotFoundError, type CurrencyRepository } from '../currencies';
import { IndicatorNotFoundError, indicatorId, type IndicatorKey, type IndicatorRepository } from '../indicators';
import type { FavoriteRepository } from './favorites.repository';
import type { FavoritesDto } from './favorites.types';

export interface FavoritesManager {
  list(clientId: ClientId): Promise<FavoritesDto>;
  addCurrency(clientId: ClientId, code: string): Promise<void>;
  removeCurrency(clientId: ClientId, code: string): Promise<void>;
  addIndicator(clientId: ClientId, key: IndicatorKey): Promise<void>;
  removeIndicator(clientId: ClientId, key: IndicatorKey): Promise<void>;
}

export interface FavoritesServiceDependencies {
  readonly favorites: FavoriteRepository;
  readonly currencies: CurrencyRepository;
  readonly indicators: IndicatorRepository;
}

export class FavoritesService implements FavoritesManager {
  constructor(private readonly dependencies: FavoritesServiceDependencies) {}

  async list(clientId: ClientId): Promise<FavoritesDto> {
    const favorites = await this.dependencies.favorites.findByClient(clientId);
    const keysOf = (kind: string): string[] => favorites.filter((favorite) => favorite.kind === kind).map((favorite) => favorite.key);
    return { currencies: keysOf('currency'), indicators: keysOf('indicator') };
  }

  async addCurrency(clientId: ClientId, code: string): Promise<void> {
    if ((await this.dependencies.currencies.findByCode(code)) === null) throw new CurrencyNotFoundError(code);
    await this.dependencies.favorites.add(clientId, { kind: 'currency', key: code });
  }

  removeCurrency(clientId: ClientId, code: string): Promise<void> {
    return this.dependencies.favorites.remove(clientId, { kind: 'currency', key: code });
  }

  async addIndicator(clientId: ClientId, key: IndicatorKey): Promise<void> {
    if ((await this.dependencies.indicators.findByKey(key)) === null) throw new IndicatorNotFoundError(key);
    await this.dependencies.favorites.add(clientId, { kind: 'indicator', key: indicatorId(key) });
  }

  removeIndicator(clientId: ClientId, key: IndicatorKey): Promise<void> {
    return this.dependencies.favorites.remove(clientId, { kind: 'indicator', key: indicatorId(key) });
  }
}
