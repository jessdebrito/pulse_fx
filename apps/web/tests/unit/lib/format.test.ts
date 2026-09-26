import { bulletinLabel, formatPercent, formatQuoteTime, formatQuoteValue } from '../../../src/lib/format';

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
