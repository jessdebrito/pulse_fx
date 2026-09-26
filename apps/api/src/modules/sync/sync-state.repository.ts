import type { Database } from '../../database/client';
import type { SyncState as SyncStateRow } from '../../generated/prisma/client';
import { CalendarDate } from '../../shared/calendar-date';
import type { SyncState } from './sync.types';

export interface SyncStateRepository {
  findByCurrency(currencyCode: string): Promise<SyncState | null>;
  save(state: SyncState): Promise<void>;
}

export class PrismaSyncStateRepository implements SyncStateRepository {
  constructor(private readonly prisma: Database) {}

  async findByCurrency(currencyCode: string): Promise<SyncState | null> {
    const row = await this.prisma.syncState.findUnique({ where: { currencyCode } });
    return row === null ? null : toSyncState(row);
  }

  async save(state: SyncState): Promise<void> {
    const row = toRow(state);
    await this.prisma.syncState.upsert({ where: { currencyCode: state.currencyCode }, create: row, update: row });
  }
}

function toSyncState(row: SyncStateRow): SyncState {
  return {
    ...row,
    lastObservationDate: row.lastObservationDate === null ? null : CalendarDate.fromUtcDate(row.lastObservationDate),
  };
}

function toRow(state: SyncState): SyncStateRow {
  return { ...state, lastObservationDate: state.lastObservationDate?.toUtcDate() ?? null };
}
