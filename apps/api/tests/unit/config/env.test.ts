import { loadConfig } from '../../../src/config/env';
import { InvalidValueError } from '../../../src/shared/errors/invalid-value-error';

const REQUIRED = {
  DATABASE_URL: 'postgres://pulse:pulse@db:5432/pulse_fx',
};

describe('loadConfig', () => {
  it('should apply defaults when only DATABASE_URL is set', () => {
    expect(loadConfig(REQUIRED)).toEqual({
      databaseUrl: REQUIRED.DATABASE_URL,
      port: 4000,
      syncOpeningCron: '15 10 * * 1-5',
      syncClosingCron: '15 13 * * 1-5',
      logLevel: 'info',
    });
  });

  it('should parse numbers and use custom schedules when they are set', () => {
    const config = loadConfig({ ...REQUIRED, PORT: '8080', SYNC_OPENING_CRON: '30 10 * * 1-5', SYNC_CLOSING_CRON: '30 13 * * 1-5' });

    expect(config.port).toBe(8080);
    expect(config.syncOpeningCron).toBe('30 10 * * 1-5');
    expect(config.syncClosingCron).toBe('30 13 * * 1-5');
  });

  it('should throw InvalidValueError naming the variable when a cron expression is invalid', () => {
    const load = (): unknown => loadConfig({ ...REQUIRED, SYNC_CLOSING_CRON: 'every day at 1pm' });

    expect(load).toThrow(InvalidValueError);
    expect(load).toThrow(/SYNC_CLOSING_CRON/);
  });

  it('should throw InvalidValueError naming the variable when DATABASE_URL is missing', () => {
    const load = (): unknown => loadConfig({});

    expect(load).toThrow(InvalidValueError);
    expect(load).toThrow(/DATABASE_URL/);
  });

  it('should return a frozen object when the config is valid', () => {
    expect(Object.isFrozen(loadConfig(REQUIRED))).toBe(true);
  });
});
