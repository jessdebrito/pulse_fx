import { SystemClock } from '../../../src/shared/clock';

describe('SystemClock', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return the current instant and the Sao Paulo calendar day when it is past midnight UTC', () => {
    const instant = new Date('2026-09-25T02:30:00Z');
    jest.useFakeTimers().setSystemTime(instant);
    const clock = new SystemClock();

    expect(clock.now()).toEqual(instant);
    expect(clock.today().toString()).toBe('2026-09-24');
  });
});
