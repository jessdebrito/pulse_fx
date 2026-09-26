import { CalendarDate } from '../../../../src/shared/calendar-date';
import { initialIndicatorSyncState, initialSyncState, syncStartDate, yearChunks } from '../../../../src/modules/sync/sync-policy.rules';

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

describe('initialIndicatorSyncState', () => {
  it('should have no attempts, successes or observations when created for an indicator', () => {
    expect(initialIndicatorSyncState({ source: 'fred', code: 'IMP3510' })).toEqual({
      source: 'fred',
      code: 'IMP3510',
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

  it('should start on the last stored observation date when an indicator already has data', () => {
    const state = { ...initialIndicatorSyncState({ source: 'sgs', code: '27574' }), lastObservationDate: CalendarDate.fromIso('2026-08-01') };

    expect(syncStartDate(state, TODAY).toString()).toBe('2026-08-01');
  });
});

describe('yearChunks', () => {
  const day = (iso: string): CalendarDate => CalendarDate.fromIso(iso);
  const asText = (chunks: ReturnType<typeof yearChunks>): string[] => chunks.map((chunk) => `${chunk.from.toString()}..${chunk.to.toString()}`);

  it('should split the range at every new year when it crosses calendar years', () => {
    expect(asText(yearChunks(day('2024-01-01'), day('2026-09-26')))).toEqual([
      '2024-01-01..2024-12-31',
      '2025-01-01..2025-12-31',
      '2026-01-01..2026-09-26',
    ]);
  });

  it('should keep a single chunk when the range fits in one year', () => {
    expect(asText(yearChunks(day('2026-01-01'), day('2026-01-02')))).toEqual(['2026-01-01..2026-01-02']);
  });

  it('should return no chunks when the start is after the end', () => {
    expect(yearChunks(day('2026-01-02'), day('2026-01-01'))).toEqual([]);
  });
});
