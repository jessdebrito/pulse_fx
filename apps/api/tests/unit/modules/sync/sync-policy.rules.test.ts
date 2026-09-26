import { CalendarDate } from '../../../../src/shared/calendar-date';
import { initialSyncState, syncStartDate } from '../../../../src/modules/sync/sync-policy.rules';

const TODAY = CalendarDate.fromIso('2026-09-25');

describe('initialSyncState', () => {
  it('should have no attempts, successes or observations when created', () => {
    expect(initialSyncState('USD')).toEqual({
      currencyCode: 'USD',
      lastAttemptAt: null,
      lastSuccessAt: null,
      lastStatus: null,
      lastError: null,
      lastObservationDate: null,
    });
  });
});

describe('syncStartDate', () => {
  it('should start yesterday when the currency has no quotes yet', () => {
    expect(syncStartDate(initialSyncState('USD'), TODAY).toString()).toBe('2026-09-24');
  });

  it('should start on the last stored quote date when the currency already has data', () => {
    const state = { ...initialSyncState('USD'), lastObservationDate: CalendarDate.fromIso('2026-09-22') };

    expect(syncStartDate(state, TODAY).toString()).toBe('2026-09-22');
  });
});
