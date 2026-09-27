import request from 'supertest';
import { createApp } from '../../../../src/app';
import type { CurrenciesReader } from '../../../../src/modules/currencies';
import { FavoritesService } from '../../../../src/modules/favorites';
import type { IndicatorsReader } from '../../../../src/modules/indicators';
import type { AppLogger } from '../../../../src/shared/logger';
import { InMemoryCurrencyRepository } from '../../../support/in-memory/currencies';
import { InMemoryFavoriteRepository } from '../../../support/in-memory/favorites';
import { InMemoryIndicatorRepository } from '../../../support/in-memory/indicators';
import { recordedCurrencies } from '../../../support/sources/bcb-ptax/recorded-data';
import { recordedFredIndicator } from '../../../support/sources/fred/recorded-data';

const silentLogger: AppLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const unusedCurrencies: CurrenciesReader = { listWithLatestQuote: jest.fn(), getQuotes: jest.fn(), getAvailablePeriods: jest.fn() };
const unusedIndicators: IndicatorsReader = { listWithLatestObservation: jest.fn(), getObservations: jest.fn(), getAvailablePeriods: jest.fn() };
const CLIENT_ID = '3f2b8c1e-9d4a-4b7e-8f21-6c5d4e3a2b10';

async function appWithRecordedCatalog(): Promise<ReturnType<typeof createApp>> {
  const currencies = new InMemoryCurrencyRepository();
  const indicators = new InMemoryIndicatorRepository();
  await currencies.upsertMany(await recordedCurrencies('USD'));
  await indicators.upsert(await recordedFredIndicator('IMP3510'));
  const favoritesService = new FavoritesService({ favorites: new InMemoryFavoriteRepository(), currencies, indicators });
  return createApp({ logger: silentLogger, currenciesService: unusedCurrencies, indicatorsService: unusedIndicators, favoritesService });
}

describe('favorites routes', () => {
  it('should respond 200 with no favorites when the client never marked any', async () => {
    const response = await request(await appWithRecordedCatalog()).get('/api/favorites').set('X-Client-Id', CLIENT_ID);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ currencies: [], indicators: [] });
  });

  it('should respond 204 and list the currency when the client marks it and 204 again when unmarking it', async () => {
    const app = await appWithRecordedCatalog();

    const marked = await request(app).put('/api/favorites/currencies/USD').set('X-Client-Id', CLIENT_ID);
    const afterMarking = await request(app).get('/api/favorites').set('X-Client-Id', CLIENT_ID);
    const unmarked = await request(app).delete('/api/favorites/currencies/USD').set('X-Client-Id', CLIENT_ID);
    const afterUnmarking = await request(app).get('/api/favorites').set('X-Client-Id', CLIENT_ID);

    expect([marked.status, unmarked.status]).toEqual([204, 204]);
    expect(afterMarking.body).toEqual({ currencies: ['USD'], indicators: [] });
    expect(afterUnmarking.body).toEqual({ currencies: [], indicators: [] });
  });

  it('should respond 204 and list the indicator when the client marks it and 204 again when unmarking it', async () => {
    const app = await appWithRecordedCatalog();

    const marked = await request(app).put('/api/favorites/indicators/fred/IMP3510').set('X-Client-Id', CLIENT_ID);
    const afterMarking = await request(app).get('/api/favorites').set('X-Client-Id', CLIENT_ID);
    const unmarked = await request(app).delete('/api/favorites/indicators/fred/IMP3510').set('X-Client-Id', CLIENT_ID);

    expect([marked.status, unmarked.status]).toEqual([204, 204]);
    expect(afterMarking.body).toEqual({ currencies: [], indicators: ['fred/IMP3510'] });
  });

  it.each([
    ['CURRENCY_NOT_FOUND', '/api/favorites/currencies/XYZ'],
    ['INDICATOR_NOT_FOUND', '/api/favorites/indicators/sgs/99999'],
  ])('should respond 404 with %s when marking an item outside the catalog', async (code, url) => {
    const response = await request(await appWithRecordedCatalog()).put(url).set('X-Client-Id', CLIENT_ID);

    expect(response.status).toBe(404);
    expect((response.body as { error: { code: string } }).error.code).toBe(code);
  });

  it.each([
    ['no X-Client-Id header', 'get', '/api/favorites', undefined],
    ['an X-Client-Id that is not a UUID v4', 'get', '/api/favorites', 'browser-1'],
    ['an unknown indicator source', 'put', '/api/favorites/indicators/ibge/1', CLIENT_ID],
  ] as const)('should respond 400 with INVALID_VALUE when the request has %s', async (_case, method, url, clientId) => {
    const app = await appWithRecordedCatalog();
    const pending = method === 'get' ? request(app).get(url) : request(app).put(url);

    const response = await (clientId === undefined ? pending : pending.set('X-Client-Id', clientId));

    expect(response.status).toBe(400);
    expect((response.body as { error: { code: string } }).error.code).toBe('INVALID_VALUE');
  });
});
