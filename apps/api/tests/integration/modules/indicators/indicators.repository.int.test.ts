import type { DatabaseClient } from '../../../../src/database/client';
import { PrismaIndicatorRepository } from '../../../../src/modules/indicators';
import { connectTestDatabase, disconnectTestDatabase, resetTestDatabase } from '../../../support/database/test-database';
import { recordedSgsIndicator } from '../../../support/sources/bcb-sgs/recorded-data';
import { recordedFredIndicator } from '../../../support/sources/fred/recorded-data';

describe('PrismaIndicatorRepository', () => {
  let client: DatabaseClient;
  let repository: PrismaIndicatorRepository;

  beforeAll(() => {
    client = connectTestDatabase();
    repository = new PrismaIndicatorRepository(client.prisma);
  });

  beforeEach(async () => {
    await resetTestDatabase(client);
  });

  afterAll(async () => {
    await disconnectTestDatabase(client);
  });

  it('should store the indicator with the name, unit and frequency published by the source when upserting', async () => {
    const commodities = await recordedSgsIndicator('27574');

    await repository.upsert(commodities);

    await expect(repository.findByKey({ source: 'sgs', code: '27574' })).resolves.toEqual({
      source: 'sgs',
      code: '27574',
      name: 'Índice de Commodities - Brasil',
      unit: 'Índice',
      frequency: 'monthly',
    });
  });

  it('should update the stored details without duplicating when the same indicator is upserted again', async () => {
    const imports = await recordedFredIndicator('IMP3510');
    await repository.upsert(imports);

    await repository.upsert({ ...imports, unit: 'Millions of U.S. Dollars' });

    await expect(repository.findAll()).resolves.toEqual([{ ...imports, unit: 'Millions of U.S. Dollars' }]);
  });

  it('should list every indicator ordered by source and code', async () => {
    await repository.upsert(await recordedSgsIndicator('27574'));
    await repository.upsert(await recordedFredIndicator('IMP3510'));
    await repository.upsert(await recordedFredIndicator('EPUTRADE'));
    await repository.upsert(await recordedSgsIndicator('22708'));

    const indicators = await repository.findAll();

    expect(indicators.map((indicator) => `${indicator.source}/${indicator.code}`)).toEqual(['fred/EPUTRADE', 'fred/IMP3510', 'sgs/22708', 'sgs/27574']);
  });

  it('should return null when the indicator is not in the catalog', async () => {
    await repository.upsert(await recordedFredIndicator('IMP3510'));

    await expect(repository.findByKey({ source: 'sgs', code: 'IMP3510' })).resolves.toBeNull();
  });
});
