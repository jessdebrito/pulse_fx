import {
  bulletinLabel,
  formatIndicatorValue,
  formatPercent,
  formatQuoteTime,
  formatQuoteValue,
  formatReferenceDate,
  frequencyLabel,
  sourceLabel,
} from '../../../src/lib/format';

describe('formatQuoteValue', () => {
  it('should use a comma and four decimals when formatting a PTAX rate', () => {
    expect(formatQuoteValue(5.1991)).toBe('5,1991');
  });

  it('should keep the fifth decimal when the rate needs it', () => {
    expect(formatQuoteValue(0.03308)).toBe('0,03308');
  });

  it('should pad to four decimals when the source dropped trailing zeros', () => {
    expect(formatQuoteValue(5.15)).toBe('5,1500');
  });
});

describe('formatQuoteTime', () => {
  it('should show the Brasilia day and time when formatting a PTAX quote time', () => {
    expect(formatQuoteTime('2026-09-25T13:10:17.447657-03:00')).toBe('25/09/2026 13:10');
  });
});

describe('bulletinLabel', () => {
  it.each([
    ['opening', 'Abertura'],
    ['intermediate', 'Intermediário'],
    ['closing', 'Fechamento'],
  ] as const)('should label %p as %p when showing the bulletin type', (bulletin, label) => {
    expect(bulletinLabel(bulletin)).toBe(label);
  });
});

describe('formatPercent', () => {
  it.each([
    [0.5978, '+0,60%'],
    [-0.5, '-0,50%'],
    [0, '0,00%'],
  ])('should format %p as %p when showing a variation', (value, expected) => {
    expect(formatPercent(value)).toBe(expected);
  });
});

describe('formatIndicatorValue', () => {
  it.each([
    [3387.521714, '3.387,52'],
    [1248.2368946779902, '1.248,24'],
    [1.504409090909091, '1,50'],
    [34242.6, '34.242,60'],
    [-1234.5, '-1.234,50'],
  ])('should format %p as %p with two decimals', (value, expected) => {
    expect(formatIndicatorValue(value)).toBe(expected);
  });
});

describe('formatReferenceDate', () => {
  it.each([
    ['2026-07-01', 'monthly', 'jul/2026'],
    ['2026-04-01', 'quarterly', '2º tri/2026'],
    ['2025-10-01', 'quarterly', '4º tri/2025'],
    ['2026-01-01', 'annual', '2026'],
    ['2026-09-24', 'daily', '24/09/2026'],
    ['2026-09-21', 'weekly', '21/09/2026'],
  ] as const)('should show %p of a %s series as %p', (date, frequency, expected) => {
    expect(formatReferenceDate(date, frequency)).toBe(expected);
  });
});

describe('frequencyLabel', () => {
  it.each([
    ['daily', 'Diária'],
    ['weekly', 'Semanal'],
    ['monthly', 'Mensal'],
    ['quarterly', 'Trimestral'],
    ['annual', 'Anual'],
  ] as const)('should label %p as %p', (frequency, label) => {
    expect(frequencyLabel(frequency)).toBe(label);
  });
});

describe('sourceLabel', () => {
  it.each([
    ['fred', 'FRED'],
    ['sgs', 'BCB SGS'],
  ] as const)('should label %p as %p', (source, label) => {
    expect(sourceLabel(source)).toBe(label);
  });
});
