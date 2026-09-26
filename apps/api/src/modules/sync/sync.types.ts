import type { CalendarDate } from '../../shared/calendar-date';
import type { IndicatorKey } from '../indicators';

export type SyncStatus = 'success' | 'failure';

export interface CalendarRange {
  readonly from: CalendarDate;
  readonly to: CalendarDate;
}

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

export interface BackfillReportDto {
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly from: string;
  readonly to: string;
  readonly results: readonly QuoteSyncResultDto[];
}

export interface IndicatorSyncState extends IndicatorKey {
  readonly lastAttemptAt: Date | null;
  readonly lastSuccessAt: Date | null;
  readonly lastStatus: SyncStatus | null;
  readonly lastError: string | null;
  readonly lastObservationDate: CalendarDate | null;
}

export interface IndicatorSyncResultDto extends IndicatorKey {
  readonly status: SyncResultStatus;
  readonly upserted: number;
  readonly error?: string;
}

export interface IndicatorSyncReportDto {
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly results: readonly IndicatorSyncResultDto[];
}

export interface IndicatorBackfillReportDto extends IndicatorSyncReportDto {
  readonly from: string;
  readonly to: string;
}
