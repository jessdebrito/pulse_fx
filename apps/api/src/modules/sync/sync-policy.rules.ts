import { CalendarDate } from '../../shared/calendar-date';
import type { IndicatorKey } from '../indicators';
import { INITIAL_LOAD_DAYS_BACK } from './sync.constants';

const YEAR_LENGTH = 4;
import type { CalendarRange, IndicatorSyncState, SyncState } from './sync.types';

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

export function initialIndicatorSyncState(key: IndicatorKey): IndicatorSyncState {
  return {
    source: key.source,
    code: key.code,
    lastAttemptAt: null,
    lastSuccessAt: null,
    lastStatus: null,
    lastError: null,
    lastObservationDate: null,
  };
}

export function syncStartDate(state: Pick<SyncState, 'lastObservationDate'>, today: CalendarDate): CalendarDate {
  return state.lastObservationDate ?? today.addDays(-INITIAL_LOAD_DAYS_BACK);
}

export function yearChunks(from: CalendarDate, to: CalendarDate): CalendarRange[] {
  const chunks: CalendarRange[] = [];
  let start = from;
  while (!to.isBefore(start)) {
    const endOfYear = CalendarDate.fromIso(`${start.toString().slice(0, YEAR_LENGTH)}-12-31`);
    const end = to.isBefore(endOfYear) ? to : endOfYear;
    chunks.push({ from: start, to: end });
    start = end.addDays(1);
  }
  return chunks;
}
