import type { CalendarDate } from '../../shared/calendar-date';
import { INITIAL_LOAD_DAYS_BACK } from './sync.constants';
import type { SyncState } from './sync.types';

export function initialSyncState(currencyCode: string): SyncState {
  return {
    currencyCode,
    lastAttemptAt: null,
    lastSuccessAt: null,
    lastStatus: null,
    lastError: null,
    lastObservationDate: null,
  };
}

export function syncStartDate(state: SyncState, today: CalendarDate): CalendarDate {
  return state.lastObservationDate ?? today.addDays(-INITIAL_LOAD_DAYS_BACK);
}
