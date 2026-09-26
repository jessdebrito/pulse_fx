import { parseBackfillArguments } from '../../../../src/modules/sync/backfill-arguments';
import { CalendarDate } from '../../../../src/shared/calendar-date';
import { InvalidValueError } from '../../../../src/shared/errors/invalid-value-error';

const TODAY = CalendarDate.fromIso('2026-09-26');

function asText(argv: readonly string[]): string {
  const range = parseBackfillArguments(argv, TODAY);
  return `${range.from.toString()}..${range.to.toString()}`;
}

describe('parseBackfillArguments', () => {
  it('should run until today when only --from is given', () => {
    expect(asText(['--from', '2024-01-01'])).toBe('2024-01-01..2026-09-26');
  });

  it('should use --to when it is given', () => {
    expect(asText(['--from', '2024-01-01', '--to', '2024-12-31'])).toBe('2024-01-01..2024-12-31');
  });

  it.each([
    ['--from is missing', ['--to', '2024-12-31']],
    ['--from is not a real date', ['--from', '2024-02-30']],
    ['--from is after --to', ['--from', '2025-01-01', '--to', '2024-12-31']],
    ['--from is after today', ['--from', '2026-09-27']],
  ])('should throw InvalidValueError when %s', (_case, argv) => {
    expect(() => parseBackfillArguments(argv, TODAY)).toThrow(InvalidValueError);
  });
});
