import type { SyncLock } from '../../../src/modules/sync/sync-lock.repository';
import type { SyncStateRepository } from '../../../src/modules/sync/sync-state.repository';
import { SyncInProgressError } from '../../../src/modules/sync/sync.errors';
import type { SyncState } from '../../../src/modules/sync/sync.types';

export class InMemorySyncStateRepository implements SyncStateRepository {
  private readonly states = new Map<string, SyncState>();

  findByCurrency(currencyCode: string): Promise<SyncState | null> {
    return Promise.resolve(this.states.get(currencyCode) ?? null);
  }

  save(state: SyncState): Promise<void> {
    this.states.set(state.currencyCode, state);
    return Promise.resolve();
  }

  find(currencyCode: string): SyncState | undefined {
    return this.states.get(currencyCode);
  }
}

export class InMemorySyncLock implements SyncLock {
  isHeldElsewhere = false;

  withLock<T>(task: () => Promise<T>): Promise<T> {
    return this.isHeldElsewhere ? Promise.reject(new SyncInProgressError()) : task();
  }
}
