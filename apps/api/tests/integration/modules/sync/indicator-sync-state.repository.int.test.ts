import type { DatabaseClient } from '../../../../src/database/client';
import { PrismaIndicatorSyncStateRepository } from '../../../../src/modules/sync/indicator-sync-state.repository';
import type { IndicatorSyncState } from '../../../../src/modules/sync/sync.types';
import { CalendarDate } from '../../../../src/shared/calendar-date';
import { connectTestDatabase, disconnectTestDatabase, resetTestDatabase } from '../../../support/database/test-database';

const SUCCESS_STATE: IndicatorSyncState = {
  source: 'sgs',
  code: '27574',
  lastAttemptAt: new Date('2026-09-24T16:15:00.000Z'),
  lastSuccessAt: new Date('2026-09-24T16:15:00.000Z'),
  lastStatus: 'success',
  lastError: null,
  lastObservationDate: CalendarDate.fromIso('2026-08-01'),
};

describe('PrismaIndicatorSyncStateRepository', () => {
  let client: DatabaseClient;
  let repository: PrismaIndicatorSyncStateRepository;

  beforeAll(() => {
    client = connectTestDatabase();
    repository = new PrismaIndicatorSyncStateRepository(client.prisma);
  });

  beforeEach(async () => {
    await resetTestDatabase(client);
  });

  afterAll(async () => {
    await disconnectTestDatabase(client);
  });

  it('should return null when the indicator was never synced', async () => {
    await expect(repository.findByIndicator({ source: 'sgs', code: '27574' })).resolves.toBeNull();
  });

  it('should read back the same state when it was saved', async () => {
    await repository.save(SUCCESS_STATE);

    await expect(repository.findByIndicator({ source: 'sgs', code: '27574' })).resolves.toEqual(SUCCESS_STATE);
  });

  it('should overwrite the previous state when saving the same indicator again', async () => {
    await repository.save(SUCCESS_STATE);
    const failure: IndicatorSyncState = { ...SUCCESS_STATE, lastAttemptAt: new Date('2026-09-24T17:00:00.000Z'), lastStatus: 'failure', lastError: 'SGS timeout' };

    await repository.save(failure);

    await expect(repository.findByIndicator({ source: 'sgs', code: '27574' })).resolves.toEqual(failure);
  });

  it('should record the failure of an indicator whose metadata was never stored', async () => {
    const failure: IndicatorSyncState = { source: 'fred', code: 'IMP3510', lastAttemptAt: new Date('2026-09-24T16:15:00.000Z'), lastSuccessAt: null, lastStatus: 'failure', lastError: 'FRED timeout', lastObservationDate: null };

    await repository.save(failure);

    await expect(repository.findByIndicator({ source: 'fred', code: 'IMP3510' })).resolves.toEqual(failure);
  });
});
