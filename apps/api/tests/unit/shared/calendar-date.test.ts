import { CalendarDate } from '../../../src/shared/calendar-date';
import { InvalidValueError } from '../../../src/shared/errors/invalid-value-error';

describe('CalendarDate', () => {
  it('should keep the value when the ISO date is valid', () => {
    expect(CalendarDate.fromIso('2026-09-24').toString()).toBe('2026-09-24');
  });

  it.each(['2026-02-30', '2026-13-01', '24/09/2026', '2026-9-24', ''])(
    'should throw InvalidValueError when the date is %p',
    (value) => {
      expect(() => CalendarDate.fromIso(value)).toThrow(InvalidValueError);
    },
  );

  it('should use the calendar day of the given time zone when built from an instant', () => {
    const instant = new Date('2026-09-25T02:30:00Z');

    expect(CalendarDate.fromInstant(instant, 'America/Sao_Paulo').toString()).toBe('2026-09-24');
  });

  it('should cross month and year boundaries when adding days', () => {
    expect(CalendarDate.fromIso('2026-01-01').addDays(-1).toString()).toBe('2025-12-31');
    expect(CalendarDate.fromIso('2026-02-28').addDays(1).toString()).toBe('2026-03-01');
  });

  it('should clamp to the last day of the month when adding months from day 31', () => {
    expect(CalendarDate.fromIso('2026-03-31').addMonths(-1).toString()).toBe('2026-02-28');
    expect(CalendarDate.fromIso('2026-09-01').addMonths(-72).toString()).toBe('2020-09-01');
  });

  it('should map to UTC midnight when converting to a DATE column value', () => {
    expect(CalendarDate.fromIso('2026-09-24').toUtcDate()).toEqual(new Date('2026-09-24T00:00:00.000Z'));
  });

  it('should keep the UTC calendar day when reading a DATE column value', () => {
    expect(CalendarDate.fromUtcDate(new Date('2026-09-24T00:00:00.000Z')).toString()).toBe('2026-09-24');
  });

  it('should compare dates by calendar order when checking before and equality', () => {
    const earlier = CalendarDate.fromIso('2026-09-23');
    const later = CalendarDate.fromIso('2026-09-24');

    expect(earlier.isBefore(later)).toBe(true);
    expect(later.isBefore(earlier)).toBe(false);
    expect(earlier.equals(CalendarDate.fromIso('2026-09-23'))).toBe(true);
  });
});
