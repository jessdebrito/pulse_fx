import type { CalendarDate } from '../../shared/calendar-date';

export type SyncStatus = 'success' | 'failure';

export interface SyncState {
  readonly currencyCode: string;
  readonly lastAttemptAt: Date | null;
  readonly lastSuccessAt: Date | null;
  readonly lastStatus: SyncStatus | null;
  readonly lastError: string | null;
  readonly lastObservationDate: CalendarDate | null;
}

export type SyncResultStatus = 'synced' | 'failed';

export interface CatalogSyncResultDto {
  readonly status: SyncResultStatus;
  readonly currencies: number;
  readonly error?: string;
}

export interface QuoteSyncResultDto {
  readonly currencyCode: string;
  readonly status: SyncResultStatus;
  readonly upserted: number;
  readonly error?: string;
}

export interface SyncReportDto {
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly catalog: CatalogSyncResultDto;
  readonly results: readonly QuoteSyncResultDto[];
}
