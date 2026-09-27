import request from 'supertest';
import { createApp } from '../../../../src/app';
import { CurrenciesService, type CurrenciesReader } from '../../../../src/modules/currencies';
import type { FavoritesManager } from '../../../../src/modules/favorites';
import type { IndicatorsReader } from '../../../../src/modules/indicators';
import { CalendarDate } from '../../../../src/shared/calendar-date';
import type { AppLogger } from '../../../../src/shared/logger';
import { InMemoryCurrencyQuoteRepository, InMemoryCurrencyRepository } from '../../../support/in-memory/currencies';
import { recordedCurrencies, recordedQuotes } from '../../../support/sources/bcb-ptax/recorded-data';

const silentLogger: AppLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const unusedFavorites: FavoritesManager = { list: jest.fn(), addCurrency: jest.fn(), removeCurrency: jest.fn(), addIndicator: jest.fn(), removeIndicator: jest.fn() };
const unusedIndicators: IndicatorsReader = { listWithLatestObservation: jest.fn(), getObservations: jest.fn(), getAvailablePeriods: jest.fn() };

async function recordedService(): Promise<CurrenciesService> {
  const currencies = new InMemoryCurrencyRepository();
  const quotes = new InMemoryCurrencyQuoteRepository();
  await currencies.upsertMany(await recordedCurrencies('EUR', 'USD'));
  await quotes.upsertMany('USD', await recordedQuotes('USD', '2026-09-23-to-2026-09-24'));
  return new CurrenciesService({ currencies, quotes });
}

describe('GET /api/currencies', () => {
  it('should respond 200 with every currency and its latest quote when the service answers', async () => {
    const service = await recordedService();

    const response = await request(createApp({ logger: silentLogger, currenciesService: service, indicatorsService: unusedIndicators, favoritesService: unusedFavorites })).get('/api/currencies');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(await service.listWithLatestQuote());
  });

  it('should respond 500 without leaking details when the service fails', async () => {
    const failing: CurrenciesReader = { listWithLatestQuote: () => Promise.reject(new Error('database is down')), getQuotes: jest.fn(), getAvailablePeriods: jest.fn() };

    const response = await request(createApp({ logger: silentLogger, currenciesService: failing, indicatorsService: unusedIndicators, favoritesService: unusedFavorites })).get('/api/currencies');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
  });
});

describe('GET /api/currencies/:code/quotes', () => {
  it('should respond 200 with the quotes of the period when the currency exists', async () => {
    const service = await recordedService();

    const response = await request(createApp({ logger: silentLogger, currenciesService: service, indicatorsService: unusedIndicators, favoritesService: unusedFavorites })).get('/api/currencies/USD/quotes?from=2026-01-01&to=2026-09-25');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(await service.getQuotes('USD', CalendarDate.fromIso('2026-01-01'), CalendarDate.fromIso('2026-09-25')));
  });

  it('should respond 404 with CURRENCY_NOT_FOUND when the currency is not in the catalog', async () => {
    const response = await request(createApp({ logger: silentLogger, currenciesService: await recordedService(), indicatorsService: unusedIndicators, favoritesService: unusedFavorites })).get('/api/currencies/XYZ/quotes?from=2026-01-01&to=2026-09-25');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: { code: 'CURRENCY_NOT_FOUND', message: 'Currency XYZ is not in the catalog' } });
  });

  it.each([
    ['an invalid currency code', '/api/currencies/usd1/quotes?from=2026-01-01&to=2026-09-25'],
    ['a missing start date', '/api/currencies/USD/quotes?to=2026-09-25'],
    ['an impossible date', '/api/currencies/USD/quotes?from=2026-02-30&to=2026-09-25'],
    ['a start date after the end date', '/api/currencies/USD/quotes?from=2026-09-25&to=2026-01-01'],
  ])('should respond 400 with INVALID_VALUE when the request has %s', async (_case, url) => {
    const response = await request(createApp({ logger: silentLogger, currenciesService: await recordedService(), indicatorsService: unusedIndicators, favoritesService: unusedFavorites })).get(url);

    expect(response.status).toBe(400);
    expect((response.body as { error: { code: string } }).error.code).toBe('INVALID_VALUE');
  });
});

describe('GET /api/currencies/:code/periods', () => {
  it('should respond 200 with the years and months that have quotes when the currency exists', async () => {
    const service = await recordedService();

    const response = await request(createApp({ logger: silentLogger, currenciesService: service, indicatorsService: unusedIndicators, favoritesService: unusedFavorites })).get('/api/currencies/USD/periods');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ code: 'USD', periods: [{ year: 2026, months: [9] }] });
  });

  it('should respond 404 with CURRENCY_NOT_FOUND when the currency is not in the catalog', async () => {
    const response = await request(createApp({ logger: silentLogger, currenciesService: await recordedService(), indicatorsService: unusedIndicators, favoritesService: unusedFavorites })).get('/api/currencies/XYZ/periods');

    expect(response.status).toBe(404);
    expect((response.body as { error: { code: string } }).error.code).toBe('CURRENCY_NOT_FOUND');
  });

  it('should respond 400 with INVALID_VALUE when the currency code is invalid', async () => {
    const response = await request(createApp({ logger: silentLogger, currenciesService: await recordedService(), indicatorsService: unusedIndicators, favoritesService: unusedFavorites })).get('/api/currencies/usd1/periods');

    expect(response.status).toBe(400);
    expect((response.body as { error: { code: string } }).error.code).toBe('INVALID_VALUE');
  });
});
