import type { DatabaseClient } from '../../../../src/database/client';
import { PrismaSyncStateRepository } from '../../../../src/modules/sync/sync-state.repository';
import type { SyncState } from '../../../../src/modules/sync/sync.types';
import { CalendarDate } from '../../../../src/shared/calendar-date';
import { connectTestDatabase, disconnectTestDatabase, insertCurrencies, resetTestDatabase } from '../../../support/database/test-database';
import { recordedCurrencies } from '../../../support/sources/bcb-ptax/recorded-data';

const SUCCESS_STATE: SyncState = {
  currencyCode: 'USD',
  lastAttemptAt: new Date('2026-09-25T16:15:00.000Z'),
  lastSuccessAt: new Date('2026-09-25T16:15:00.000Z'),
  lastStatus: 'success',
  lastError: null,
  lastObservationDate: CalendarDate.fromIso('2026-09-24'),
};

describe('PrismaSyncStateRepository', () => {
  let client: DatabaseClient;
  let repository: PrismaSyncStateRepository;

  beforeAll(() => {
    client = connectTestDatabase();
    repository = new PrismaSyncStateRepository(client.prisma);
  });

  beforeEach(async () => {
    await resetTestDatabase(client);
    await insertCurrencies(client, await recordedCurrencies('USD'));
  });

  afterAll(async () => {
    await disconnectTestDatabase(client);
  });

  it('should return null when the currency was never synced', async () => {
    await expect(repository.findByCurrency('USD')).resolves.toBeNull();
  });

  it('should read back the same state when it was saved', async () => {
    await repository.save(SUCCESS_STATE);

    await expect(repository.findByCurrency('USD')).resolves.toEqual(SUCCESS_STATE);
  });

  it('should overwrite the previous state when saving the same currency again', async () => {
    await repository.save(SUCCESS_STATE);
    const failure: SyncState = { ...SUCCESS_STATE, lastAttemptAt: new Date('2026-09-25T17:00:00.000Z'), lastStatus: 'failure', lastError: 'BCB timeout' };

    await repository.save(failure);

    await expect(repository.findByCurrency('USD')).resolves.toEqual(failure);
  });
});
