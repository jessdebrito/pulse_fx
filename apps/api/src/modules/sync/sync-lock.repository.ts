import type { Pool } from 'pg';
import { SYNC_ADVISORY_LOCK_KEY } from './sync.constants';
import { SyncInProgressError } from './sync.errors';

export interface SyncLock {
  withLock<T>(task: () => Promise<T>): Promise<T>;
}

export class PgAdvisorySyncLock implements SyncLock {
  constructor(
    private readonly pool: Pool,
    private readonly lockKey: number = SYNC_ADVISORY_LOCK_KEY,
  ) {}

  async withLock<T>(task: () => Promise<T>): Promise<T> {
    const connection = await this.pool.connect();
    try {
      const result = await connection.query<{ acquired: boolean }>('select pg_try_advisory_lock($1) as acquired', [this.lockKey]);
      if (result.rows[0]?.acquired !== true) throw new SyncInProgressError();
      try {
        return await task();
      } finally {
        await connection.query('select pg_advisory_unlock($1)', [this.lockKey]);
      }
    } finally {
      connection.release();
    }
  }
}
