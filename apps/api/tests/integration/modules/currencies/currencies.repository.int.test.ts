import type { DatabaseClient } from '../../../../src/database/client';
import { PrismaCurrencyRepository } from '../../../../src/modules/currencies';
import type { Currency } from '../../../../src/modules/currencies';
import { connectTestDatabase, disconnectTestDatabase, resetTestDatabase } from '../../../support/database/test-database';
import { recordedCurrencies } from '../../../support/sources/bcb-ptax/recorded-data';

describe('PrismaCurrencyRepository', () => {
  let client: DatabaseClient;
  let repository: PrismaCurrencyRepository;
  let euro: Currency;
  let usDollar: Currency;

  beforeAll(async () => {
    client = connectTestDatabase();
    repository = new PrismaCurrencyRepository(client.prisma);
    [euro, usDollar] = (await recordedCurrencies('EUR', 'USD')) as [Currency, Currency];
  });

  beforeEach(async () => {
    await resetTestDatabase(client);
  });

  afterAll(async () => {
    await disconnectTestDatabase(client);
  });

  it('should return the catalog ordered by code when it was stored', async () => {
    await expect(repository.upsertMany([usDollar, euro])).resolves.toBe(2);

    await expect(repository.findAll()).resolves.toEqual([euro, usDollar]);
  });

  it('should update name and type without duplicating when the BCB changes a currency', async () => {
    await repository.upsertMany([{ ...usDollar, name: 'Old name' }]);

    await repository.upsertMany([usDollar]);

    await expect(repository.findAll()).resolves.toEqual([usDollar]);
  });

  it('should return zero and keep the table empty when the catalog is empty', async () => {
    await expect(repository.upsertMany([])).resolves.toBe(0);
    await expect(repository.findAll()).resolves.toEqual([]);
  });

  it('should find the currency when the code exists and return null when it does not', async () => {
    await repository.upsertMany([usDollar, euro]);

    await expect(repository.findByCode('USD')).resolves.toEqual(usDollar);
    await expect(repository.findByCode('XYZ')).resolves.toBeNull();
  });
});
