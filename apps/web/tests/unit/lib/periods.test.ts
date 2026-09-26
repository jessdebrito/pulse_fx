import { defaultSelection, monthLabel, monthShortLabel, periodAxis, rangeOfSelection, selectYear, switchGranularity } from '../../../src/lib/periods';
import { recordedUsdPeriodsAcrossYears } from '../../support/api/recorded-currencies';

const available = recordedUsdPeriodsAcrossYears().periods;

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
