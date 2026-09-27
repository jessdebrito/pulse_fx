import { CalendarDate } from '../../../src/shared/calendar-date';
import { toTrendDto } from '../../../src/shared/trend.rules';

describe('toTrendDto', () => {
  it('should turn each dated value into its ISO date and number keeping the order', () => {
    const points = [
      { date: CalendarDate.fromIso('2026-09-24'), value: 5.1795 },
      { date: CalendarDate.fromIso('2026-09-25'), value: 5.1991 },
    ];

    expect(toTrendDto(points)).toEqual([
      { date: '2026-09-24', value: 5.1795 },
      { date: '2026-09-25', value: 5.1991 },
    ]);
  });

  it('should return an empty trend when there are no points', () => {
    expect(toTrendDto([])).toEqual([]);
  });
});
