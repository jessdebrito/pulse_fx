import type { DatabaseClient } from '../../../../src/database/client';
import { PrismaFavoriteRepository } from '../../../../src/modules/favorites';
import { ClientId } from '../../../../src/shared/client-id';
import { connectTestDatabase, disconnectTestDatabase, resetTestDatabase } from '../../../support/database/test-database';

const clientId = (): ClientId => ClientId.fromString('3f2b8c1e-9d4a-4b7e-8f21-6c5d4e3a2b10');
const otherClientId = (): ClientId => ClientId.fromString('7a1c2d3e-4f5a-4b6c-9d8e-0f1a2b3c4d5e');

describe('PrismaFavoriteRepository', () => {
  let client: DatabaseClient;
  let repository: PrismaFavoriteRepository;

  beforeAll(() => {
    client = connectTestDatabase();
    repository = new PrismaFavoriteRepository(client.prisma);
  });

  beforeEach(async () => {
    await resetTestDatabase(client);
  });

  afterAll(async () => {
    await disconnectTestDatabase(client);
  });

  it('should store the favorites of a client and list them ordered by kind and key', async () => {
    await repository.add(clientId(), { kind: 'indicator', key: 'sgs/27574' });
    await repository.add(clientId(), { kind: 'currency', key: 'USD' });
    await repository.add(clientId(), { kind: 'indicator', key: 'fred/IMP3510' });
    await repository.add(clientId(), { kind: 'currency', key: 'EUR' });

    await expect(repository.findByClient(clientId())).resolves.toEqual([
      { kind: 'currency', key: 'EUR' },
      { kind: 'currency', key: 'USD' },
      { kind: 'indicator', key: 'fred/IMP3510' },
      { kind: 'indicator', key: 'sgs/27574' },
    ]);
  });

  it('should keep a single row when the same favorite is added twice', async () => {
    await repository.add(clientId(), { kind: 'currency', key: 'USD' });
    await repository.add(clientId(), { kind: 'currency', key: 'USD' });

    await expect(repository.findByClient(clientId())).resolves.toEqual([{ kind: 'currency', key: 'USD' }]);
  });

  it('should delete only the removed favorite and ignore removing one that is not stored', async () => {
    await repository.add(clientId(), { kind: 'currency', key: 'USD' });
    await repository.add(clientId(), { kind: 'indicator', key: 'fred/IMP3510' });

    await repository.remove(clientId(), { kind: 'currency', key: 'USD' });
    await repository.remove(clientId(), { kind: 'currency', key: 'EUR' });

    await expect(repository.findByClient(clientId())).resolves.toEqual([{ kind: 'indicator', key: 'fred/IMP3510' }]);
  });

  it('should keep the favorites of each client apart', async () => {
    await repository.add(clientId(), { kind: 'currency', key: 'USD' });
    await repository.add(otherClientId(), { kind: 'currency', key: 'EUR' });

    await expect(repository.findByClient(otherClientId())).resolves.toEqual([{ kind: 'currency', key: 'EUR' }]);
  });
});
