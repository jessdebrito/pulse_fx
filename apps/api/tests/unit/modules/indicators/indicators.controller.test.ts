import request from 'supertest';
import { createApp } from '../../../../src/app';
import type { CurrenciesReader } from '../../../../src/modules/currencies';
import { IndicatorsService, type IndicatorsReader } from '../../../../src/modules/indicators';
import { CalendarDate } from '../../../../src/shared/calendar-date';
import type { AppLogger } from '../../../../src/shared/logger';
import { InMemoryIndicatorObservationRepository, InMemoryIndicatorRepository } from '../../../support/in-memory/indicators';
import { recordedSgsIndicator, recordedSgsObservations } from '../../../support/sources/bcb-sgs/recorded-data';
import { recordedFredIndicator, recordedFredObservations } from '../../../support/sources/fred/recorded-data';

const silentLogger: AppLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const unusedCurrencies: CurrenciesReader = { listWithLatestQuote: jest.fn(), getQuotes: jest.fn(), getAvailablePeriods: jest.fn() };

async function recordedService(): Promise<IndicatorsService> {
  const indicators = new InMemoryIndicatorRepository();
  const observations = new InMemoryIndicatorObservationRepository();
  await indicators.upsert(await recordedFredIndicator('IMP3510'));
  await indicators.upsert(await recordedSgsIndicator('27574'));
  await observations.upsertMany({ source: 'fred', code: 'IMP3510' }, await recordedFredObservations('IMP3510', '2026-06-01-to-2026-09-24'));
  await observations.upsertMany({ source: 'sgs', code: '27574' }, await recordedSgsObservations('27574', '2026-06-01-to-2026-09-24'));
  return new IndicatorsService({ indicators, observations });
}

function appWith(indicatorsService: IndicatorsReader): ReturnType<typeof createApp> {
  return createApp({ logger: silentLogger, currenciesService: unusedCurrencies, indicatorsService });
}

describe('GET /api/indicators', () => {
  it('should respond 200 with every indicator and its latest observation when the service answers', async () => {
    const service = await recordedService();

    const response = await request(appWith(service)).get('/api/indicators');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(await service.listWithLatestObservation());
  });

  it('should respond 500 without leaking details when the service fails', async () => {
    const failing: IndicatorsReader = { listWithLatestObservation: () => Promise.reject(new Error('database is down')), getObservations: jest.fn(), getAvailablePeriods: jest.fn() };

    const response = await request(appWith(failing)).get('/api/indicators');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  });
});

describe('GET /api/indicators/:source/:code/observations', () => {
  it('should respond 200 with the observations of the period when the indicator exists', async () => {
    const service = await recordedService();

    const response = await request(appWith(service)).get('/api/indicators/sgs/27574/observations?from=2026-01-01&to=2026-09-24');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(await service.getObservations({ source: 'sgs', code: '27574' }, CalendarDate.fromIso('2026-01-01'), CalendarDate.fromIso('2026-09-24')));
  });

  it('should respond 404 with INDICATOR_NOT_FOUND when the indicator is not in the catalog', async () => {
    const response = await request(appWith(await recordedService())).get('/api/indicators/fred/UNKNOWN/observations?from=2026-01-01&to=2026-09-24');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: { code: 'INDICATOR_NOT_FOUND', message: 'Indicator fred/UNKNOWN is not in the catalog' } });
  });

  it.each([
    ['an unknown source', '/api/indicators/ibge/27574/observations?from=2026-01-01&to=2026-09-24'],
    ['an invalid code', '/api/indicators/fred/imp-3510/observations?from=2026-01-01&to=2026-09-24'],
    ['a missing start date', '/api/indicators/fred/IMP3510/observations?to=2026-09-24'],
    ['an impossible date', '/api/indicators/fred/IMP3510/observations?from=2026-02-30&to=2026-09-24'],
    ['a start date after the end date', '/api/indicators/fred/IMP3510/observations?from=2026-09-24&to=2026-01-01'],
  ])('should respond 400 with INVALID_VALUE when the request has %s', async (_case, url) => {
    const response = await request(appWith(await recordedService())).get(url);

    expect(response.status).toBe(400);
    expect((response.body as { error: { code: string } }).error.code).toBe('INVALID_VALUE');
  });
});

describe('GET /api/indicators/:source/:code/periods', () => {
  it('should respond 200 with the years and months that have observations when the indicator exists', async () => {
    const response = await request(appWith(await recordedService())).get('/api/indicators/fred/IMP3510/periods');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ source: 'fred', code: 'IMP3510', periods: [{ year: 2026, months: [6, 7] }] });
  });

  it('should respond 404 with INDICATOR_NOT_FOUND when the indicator is not in the catalog', async () => {
    const response = await request(appWith(await recordedService())).get('/api/indicators/sgs/99999/periods');

    expect(response.status).toBe(404);
    expect((response.body as { error: { code: string } }).error.code).toBe('INDICATOR_NOT_FOUND');
  });

  it('should respond 400 with INVALID_VALUE when the source is unknown', async () => {
    const response = await request(appWith(await recordedService())).get('/api/indicators/ibge/27574/periods');

    expect(response.status).toBe(400);
    expect((response.body as { error: { code: string } }).error.code).toBe('INVALID_VALUE');
  });
});
