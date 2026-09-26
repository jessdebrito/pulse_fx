import request from 'supertest';
import { createApp } from '../../src/app';
import type { CurrenciesReader } from '../../src/modules/currencies';
import type { AppLogger } from '../../src/shared/logger';

const silentLogger: AppLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const unusedCurrencies: CurrenciesReader = { listWithLatestQuote: jest.fn(), getQuotes: jest.fn(), getAvailablePeriods: jest.fn() };

function app(): ReturnType<typeof createApp> {
  return createApp({ logger: silentLogger, currenciesService: unusedCurrencies });
}

describe('createApp', () => {
  it('should respond 404 with NOT_FOUND when the route does not exist', async () => {
    const response = await request(app()).get('/api/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Route GET /api/does-not-exist not found' } });
  });

  it.each(['/api/admin/sync', '/api/sync', '/api/indicators/sync'])('should not expose any sync route when a client posts to %s', async (url) => {
    const response = await request(app()).post(url);

    expect(response.status).toBe(404);
  });
});
