import {
  defaultSelection,
  historyWindowOf,
  monthLabel,
  monthShortLabel,
  periodAxis,
  rangeOfSelection,
  selectYear,
  switchGranularity,
  windowLabel,
  windowSelection,
} from '../../../src/lib/periods';
import { recordedUsdPeriodsAcrossYears } from '../../support/api/recorded-currencies';
import { recordedUsImportsFromBrazilPeriods } from '../../support/api/recorded-indicators';

const available = recordedUsdPeriodsAcrossYears().periods;
const monthlyIndicatorPeriods = recordedUsImportsFromBrazilPeriods().periods;
const HISTORY = { granularity: 'history', from: '2024-01', to: '2026-07' } as const;
const NINETY_DAYS = { unit: 'day', length: 90 } as const;
const TWENTY_FOUR_MONTHS = { unit: 'month', length: 24 } as const;
const USD_WINDOW = { granularity: 'window', window: NINETY_DAYS, from: '2026-06-28', to: '2026-09-25' } as const;
const US_IMPORTS_WINDOW = { granularity: 'window', window: TWENTY_FOUR_MONTHS, from: '2024-08-01', to: '2026-07-31' } as const;

describe('defaultSelection', () => {
  it('should select the most recent year with data in annual mode when periods exist', () => {
    expect(defaultSelection(available)).toEqual({ granularity: 'year', year: 2026 });
  });

  it('should return null when there are no periods with data', () => {
    expect(defaultSelection([])).toBeNull();
  });
});

describe('rangeOfSelection', () => {
  it('should cover the whole year when the selection is annual', () => {
    expect(rangeOfSelection({ granularity: 'year', year: 2026 })).toEqual({ from: '2026-01-01', to: '2026-12-31' });
  });

  it('should cover the whole month ending on its last day when the selection is monthly', () => {
    expect(rangeOfSelection({ granularity: 'month', year: 2026, month: 9 })).toEqual({ from: '2026-09-01', to: '2026-09-30' });
    expect(rangeOfSelection({ granularity: 'month', year: 2026, month: 2 })).toEqual({ from: '2026-02-01', to: '2026-02-28' });
  });
});

describe('switchGranularity', () => {
  it('should keep the year and pick its most recent month with data when switching to monthly', () => {
    expect(switchGranularity({ granularity: 'year', year: 2026 }, 'month', available)).toEqual({ granularity: 'month', year: 2026, month: 9 });
  });

  it('should keep the year when switching back to annual', () => {
    expect(switchGranularity({ granularity: 'month', year: 2025, month: 12 }, 'year', available)).toEqual({ granularity: 'year', year: 2025 });
  });
});

describe('selectYear', () => {
  it('should change only the year when the selection is annual', () => {
    expect(selectYear({ granularity: 'year', year: 2026 }, 2025, available)).toEqual({ granularity: 'year', year: 2025 });
  });

  it('should pick the most recent month with data of the new year when the current month has no data there', () => {
    expect(selectYear({ granularity: 'month', year: 2026, month: 9 }, 2025, available)).toEqual({ granularity: 'month', year: 2025, month: 12 });
  });
});

describe('monthLabel', () => {
  it.each([
    [1, 'Janeiro'],
    [9, 'Setembro'],
    [12, 'Dezembro'],
  ])('should name month %p as %p in Portuguese', (month, label) => {
    expect(monthLabel(month)).toBe(label);
  });
});

describe('periodAxis', () => {
  it('should list the twelve months of the year with short Portuguese names when the selection is annual', () => {
    expect(periodAxis({ granularity: 'year', year: 2026 })).toEqual({
      keys: ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'],
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    });
  });

  it('should list every day of the month when the selection is monthly', () => {
    const axis = periodAxis({ granularity: 'month', year: 2026, month: 9 });

    expect(axis.keys).toHaveLength(30);
    expect([axis.keys[0], axis.keys.at(-1)]).toEqual(['2026-09-01', '2026-09-30']);
    expect([axis.labels[0], axis.labels.at(-1)]).toEqual(['1', '30']);
  });

  it('should end February on day 28 when the month is shorter', () => {
    expect(periodAxis({ granularity: 'month', year: 2026, month: 2 }).keys).toHaveLength(28);
  });
});

describe('monthShortLabel', () => {
  it.each([
    [2, 'Fev'],
    [9, 'Set'],
  ])('should abbreviate month %p as %p', (month, label) => {
    expect(monthShortLabel(month)).toBe(label);
  });
});

describe('history selection', () => {
  it('should span from the first to the last month with data when switching to history', () => {
    expect(switchGranularity({ granularity: 'year', year: 2026 }, 'history', monthlyIndicatorPeriods)).toEqual(HISTORY);
  });

  it('should return to the most recent year when switching from history to annual', () => {
    expect(switchGranularity(HISTORY, 'year', monthlyIndicatorPeriods)).toEqual({ granularity: 'year', year: 2026 });
  });

  it('should return to the most recent month with data when switching from history to monthly', () => {
    expect(switchGranularity(HISTORY, 'month', monthlyIndicatorPeriods)).toEqual({ granularity: 'month', year: 2026, month: 7 });
  });

  it('should cover the first day of the first month to the last day of the last month', () => {
    expect(rangeOfSelection(HISTORY)).toEqual({ from: '2024-01-01', to: '2026-07-31' });
  });

  it('should list every month of the span with the month and the two-digit year', () => {
    const axis = periodAxis(HISTORY);

    expect(axis.keys).toHaveLength(31);
    expect([axis.keys[0], axis.keys.at(-1)]).toEqual(['2024-01', '2026-07']);
    expect(axis.labels.slice(11, 13)).toEqual(['Dez/24', 'Jan/25']);
    expect(axis.labels.at(-1)).toBe('Jul/26');
  });
});

describe('historyWindowOf', () => {
  it.each([
    ['daily', { unit: 'day', length: 90 }],
    ['weekly', { unit: 'day', length: 182 }],
    ['monthly', { unit: 'month', length: 24 }],
    ['quarterly', { unit: 'month', length: 24 }],
    ['annual', { unit: 'month', length: 120 }],
  ] as const)('should give %p series the window %p', (frequency, window) => {
    expect(historyWindowOf(frequency)).toEqual(window);
  });
});

describe('windowSelection', () => {
  it('should end a daily window on the latest observation and start it 89 days earlier', () => {
    expect(windowSelection('daily', '2026-09-25')).toEqual(USD_WINDOW);
  });

  it('should cover the 24 whole months up to the month of the latest observation when the series is monthly', () => {
    expect(windowSelection('monthly', '2026-07-01')).toEqual(US_IMPORTS_WINDOW);
  });

  it('should cover the 24 whole months up to the latest quarter when the series is quarterly', () => {
    expect(windowSelection('quarterly', '2026-04-01')).toEqual({ granularity: 'window', window: TWENTY_FOUR_MONTHS, from: '2024-05-01', to: '2026-04-30' });
  });

  it('should return null when the series has no observation yet', () => {
    expect(windowSelection('monthly', null)).toBeNull();
  });
});

describe('windowLabel', () => {
  it('should name a window in days or in months', () => {
    expect(windowLabel(NINETY_DAYS)).toBe('90 dias');
    expect(windowLabel(TWENTY_FOUR_MONTHS)).toBe('24 meses');
  });
});

describe('window selection', () => {
  it('should request exactly the dates of the window', () => {
    expect(rangeOfSelection(USD_WINDOW)).toEqual({ from: '2026-06-28', to: '2026-09-25' });
    expect(rangeOfSelection(US_IMPORTS_WINDOW)).toEqual({ from: '2024-08-01', to: '2026-07-31' });
  });

  it('should list every calendar day of a daily window labeled as day and month', () => {
    const axis = periodAxis(USD_WINDOW);

    expect(axis.keys).toHaveLength(90);
    expect([axis.keys[0], axis.keys.at(-1)]).toEqual(['2026-06-28', '2026-09-25']);
    expect([axis.labels[0], axis.labels.at(-1)]).toEqual(['28/06', '25/09']);
  });

  it('should list every month of a monthly window with the month and the two-digit year', () => {
    const axis = periodAxis(US_IMPORTS_WINDOW);

    expect(axis.keys).toHaveLength(24);
    expect([axis.keys[0], axis.keys.at(-1)]).toEqual(['2024-08', '2026-07']);
    expect([axis.labels[0], axis.labels.at(-1)]).toEqual(['Ago/24', 'Jul/26']);
  });

  it('should go to the year of the end of the window when switching to annual', () => {
    expect(switchGranularity(USD_WINDOW, 'year', available)).toEqual({ granularity: 'year', year: 2026 });
  });

  it('should go to the most recent month with data of that year when switching to monthly', () => {
    expect(switchGranularity(USD_WINDOW, 'month', available)).toEqual({ granularity: 'month', year: 2026, month: 9 });
  });
});
