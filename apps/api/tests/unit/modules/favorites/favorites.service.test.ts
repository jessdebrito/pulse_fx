import { CurrencyNotFoundError } from '../../../../src/modules/currencies';
import { FavoritesService } from '../../../../src/modules/favorites';
import { IndicatorNotFoundError } from '../../../../src/modules/indicators';
import { ClientId } from '../../../../src/shared/client-id';
import { InMemoryCurrencyRepository } from '../../../support/in-memory/currencies';
import { InMemoryFavoriteRepository } from '../../../support/in-memory/favorites';
import { InMemoryIndicatorRepository } from '../../../support/in-memory/indicators';
import { recordedSgsIndicator } from '../../../support/sources/bcb-sgs/recorded-data';
import { recordedCurrencies } from '../../../support/sources/bcb-ptax/recorded-data';
import { recordedFredIndicator } from '../../../support/sources/fred/recorded-data';

const clientId = (): ClientId => ClientId.fromString('3f2b8c1e-9d4a-4b7e-8f21-6c5d4e3a2b10');
const otherClientId = (): ClientId => ClientId.fromString('7a1c2d3e-4f5a-4b6c-9d8e-0f1a2b3c4d5e');
const US_IMPORTS_FROM_BRAZIL = { source: 'fred', code: 'IMP3510' } as const;
const BRAZIL_COMMODITIES_INDEX = { source: 'sgs', code: '27574' } as const;

async function serviceWithRecordedCatalog(): Promise<FavoritesService> {
  const currencies = new InMemoryCurrencyRepository();
  const indicators = new InMemoryIndicatorRepository();
  await currencies.upsertMany(await recordedCurrencies('EUR', 'USD'));
  await indicators.upsert(await recordedFredIndicator('IMP3510'));
  await indicators.upsert(await recordedSgsIndicator('27574'));
  return new FavoritesService({ favorites: new InMemoryFavoriteRepository(), currencies, indicators });
}

describe('FavoritesService', () => {
  it('should list no favorites when the client never marked any', async () => {
    const service = await serviceWithRecordedCatalog();

    await expect(service.list(clientId())).resolves.toEqual({ currencies: [], indicators: [] });
  });

  it('should list the marked currencies and indicators of the client in order', async () => {
    const service = await serviceWithRecordedCatalog();

    await service.addCurrency(clientId(), 'USD');
    await service.addIndicator(clientId(), BRAZIL_COMMODITIES_INDEX);
    await service.addCurrency(clientId(), 'EUR');
    await service.addIndicator(clientId(), US_IMPORTS_FROM_BRAZIL);

    await expect(service.list(clientId())).resolves.toEqual({ currencies: ['EUR', 'USD'], indicators: ['fred/IMP3510', 'sgs/27574'] });
  });

  it('should keep a single favorite when the same item is marked twice', async () => {
    const service = await serviceWithRecordedCatalog();

    await service.addCurrency(clientId(), 'USD');
    await service.addCurrency(clientId(), 'USD');

    await expect(service.list(clientId())).resolves.toEqual({ currencies: ['USD'], indicators: [] });
  });

  it('should remove only the unmarked item', async () => {
    const service = await serviceWithRecordedCatalog();
    await service.addCurrency(clientId(), 'USD');
    await service.addIndicator(clientId(), US_IMPORTS_FROM_BRAZIL);

    await service.removeCurrency(clientId(), 'USD');
    await service.removeIndicator(clientId(), BRAZIL_COMMODITIES_INDEX);

    await expect(service.list(clientId())).resolves.toEqual({ currencies: [], indicators: ['fred/IMP3510'] });
  });

  it('should keep the favorites of each client apart', async () => {
    const service = await serviceWithRecordedCatalog();

    await service.addCurrency(clientId(), 'USD');
    await service.addCurrency(otherClientId(), 'EUR');

    await expect(service.list(clientId())).resolves.toEqual({ currencies: ['USD'], indicators: [] });
    await expect(service.list(otherClientId())).resolves.toEqual({ currencies: ['EUR'], indicators: [] });
  });

  it('should throw CurrencyNotFoundError when marking a currency outside the catalog', async () => {
    const service = await serviceWithRecordedCatalog();

    await expect(service.addCurrency(clientId(), 'XYZ')).rejects.toThrow(CurrencyNotFoundError);
  });

  it('should throw IndicatorNotFoundError when marking an indicator outside the catalog', async () => {
    const service = await serviceWithRecordedCatalog();

    await expect(service.addIndicator(clientId(), { source: 'sgs', code: '99999' })).rejects.toThrow(IndicatorNotFoundError);
  });
});
