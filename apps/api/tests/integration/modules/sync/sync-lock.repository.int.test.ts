import type { DatabaseClient } from '../../../../src/database/client';
import { PgAdvisorySyncLock } from '../../../../src/modules/sync/sync-lock.repository';
import { SyncInProgressError } from '../../../../src/modules/sync/sync.errors';
import { connectTestDatabase, disconnectTestDatabase } from '../../../support/database/test-database';

const TEST_LOCK_KEY = 9_900_001;

describe('PgAdvisorySyncLock', () => {
  let client: DatabaseClient;
  let lock: PgAdvisorySyncLock;

  beforeAll(() => {
    client = connectTestDatabase();
    lock = new PgAdvisorySyncLock(client.pool, TEST_LOCK_KEY);
  });

  afterAll(async () => {
    await disconnectTestDatabase(client);
  });

  it('should run the task and return its result when the lock is free', async () => {
    await expect(lock.withLock(() => Promise.resolve('done'))).resolves.toBe('done');
  });

  it('should throw SyncInProgressError when another holder has the lock', async () => {
    let releaseFirst: () => void = () => undefined;
    const firstHolds = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    let signalAcquired: () => void = () => undefined;
    const acquired = new Promise<void>((resolve) => {
      signalAcquired = resolve;
    });
    const first = lock.withLock(async () => {
      signalAcquired();
      await firstHolds;
    });
    await acquired;

    await expect(lock.withLock(() => Promise.resolve('second'))).rejects.toThrow(SyncInProgressError);

    releaseFirst();
    await first;
  });

  it('should release the lock when the task fails', async () => {
    await expect(lock.withLock(() => Promise.reject(new Error('task failed')))).rejects.toThrow('task failed');

    await expect(lock.withLock(() => Promise.resolve('after failure'))).resolves.toBe('after failure');
  });
});
