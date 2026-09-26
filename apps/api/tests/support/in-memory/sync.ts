import { indicatorId, type IndicatorKey } from '../../../src/modules/indicators';
import type { IndicatorSyncStateRepository } from '../../../src/modules/sync/indicator-sync-state.repository';
import type { SyncLock } from '../../../src/modules/sync/sync-lock.repository';
import type { SyncStateRepository } from '../../../src/modules/sync/sync-state.repository';
import { SyncInProgressError } from '../../../src/modules/sync/sync.errors';
import type { IndicatorSyncState, SyncState } from '../../../src/modules/sync/sync.types';

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

export class InMemoryIndicatorSyncStateRepository implements IndicatorSyncStateRepository {
  private readonly states = new Map<string, IndicatorSyncState>();

  findByIndicator(key: IndicatorKey): Promise<IndicatorSyncState | null> {
    return Promise.resolve(this.states.get(indicatorId(key)) ?? null);
  }

  save(state: IndicatorSyncState): Promise<void> {
    this.states.set(indicatorId(state), state);
    return Promise.resolve();
  }

  find(key: IndicatorKey): IndicatorSyncState | undefined {
    return this.states.get(indicatorId(key));
  }
}

export class InMemorySyncLock implements SyncLock {
  isHeldElsewhere = false;

  withLock<T>(task: () => Promise<T>): Promise<T> {
    return this.isHeldElsewhere ? Promise.reject(new SyncInProgressError()) : task();
  }
}
