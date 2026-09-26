import type { Database } from '../../database/client';
import type { IndicatorSyncState as IndicatorSyncStateRow } from '../../generated/prisma/client';
import { CalendarDate } from '../../shared/calendar-date';
import type { IndicatorKey } from '../indicators';
import type { IndicatorSyncState } from './sync.types';

export interface IndicatorSyncStateRepository {
  findByIndicator(key: IndicatorKey): Promise<IndicatorSyncState | null>;
  save(state: IndicatorSyncState): Promise<void>;
}

export class PrismaIndicatorSyncStateRepository implements IndicatorSyncStateRepository {
  constructor(private readonly prisma: Database) {}

  async findByIndicator(key: IndicatorKey): Promise<IndicatorSyncState | null> {
    const row = await this.prisma.indicatorSyncState.findUnique({ where: { source_code: { source: key.source, code: key.code } } });
    return row === null ? null : toIndicatorSyncState(row);
  }

  async save(state: IndicatorSyncState): Promise<void> {
    const row = toRow(state);
    await this.prisma.indicatorSyncState.upsert({ where: { source_code: { source: state.source, code: state.code } }, create: row, update: row });
  }
}

function toIndicatorSyncState(row: IndicatorSyncStateRow): IndicatorSyncState {
  return {
    ...row,
    lastObservationDate: row.lastObservationDate === null ? null : CalendarDate.fromUtcDate(row.lastObservationDate),
  };
}

function toRow(state: IndicatorSyncState): IndicatorSyncStateRow {
  return {
    source: state.source,
    code: state.code,
    lastAttemptAt: state.lastAttemptAt,
    lastSuccessAt: state.lastSuccessAt,
    lastStatus: state.lastStatus,
    lastError: state.lastError,
    lastObservationDate: state.lastObservationDate?.toUtcDate() ?? null,
  };
}
