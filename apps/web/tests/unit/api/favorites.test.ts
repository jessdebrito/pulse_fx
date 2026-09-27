import { createFavoritesClient, type FavoriteItem } from '../../../src/api/favorites';
import type { FetchFunction } from '../../../src/api/http';
import { jsonResponse } from '../../support/api/recorded-currencies';
import { recordedFavoritesResponse } from '../../support/api/recorded-favorites';

const CLIENT_ID = '3f2b8c1e-9d4a-4b7e-8f21-6c5d4e3a2b10';

function fetchAnswering(body: unknown, status = 200): jest.Mock<ReturnType<FetchFunction>, Parameters<FetchFunction>> {
  return jest.fn<ReturnType<FetchFunction>, Parameters<FetchFunction>>().mockResolvedValue(jsonResponse(body, status));
}

describe('createFavoritesClient', () => {
  it('should request the favorites of the browser with its client id and return them parsed', async () => {
    const fetchFunction = fetchAnswering(recordedFavoritesResponse());

    await expect(createFavoritesClient(CLIENT_ID, fetchFunction).list()).resolves.toEqual({
      currencies: ['EUR', 'USD'],
      indicators: ['fred/IMP3510', 'sgs/27574'],
    });
    expect(fetchFunction).toHaveBeenCalledWith('/api/favorites', { headers: { 'X-Client-Id': CLIENT_ID } });
  });

  it.each([
    ['add', { kind: 'currency', code: 'USD' }, 'PUT', '/api/favorites/currencies/USD'],
    ['add', { kind: 'indicator', source: 'fred', code: 'IMP3510' }, 'PUT', '/api/favorites/indicators/fred/IMP3510'],
    ['remove', { kind: 'currency', code: 'USD' }, 'DELETE', '/api/favorites/currencies/USD'],
    ['remove', { kind: 'indicator', source: 'sgs', code: '27574' }, 'DELETE', '/api/favorites/indicators/sgs/27574'],
  ] as const)('should %s %p with %s %s and the client id', async (action, item: FavoriteItem, method, url) => {
    const fetchFunction = fetchAnswering(null, 204);

    await createFavoritesClient(CLIENT_ID, fetchFunction)[action](item);

    expect(fetchFunction).toHaveBeenCalledWith(url, { method, headers: { 'X-Client-Id': CLIENT_ID } });
  });

  it('should throw naming the status when a favorite cannot be saved', async () => {
    const fetchFunction = fetchAnswering({ error: { code: 'CURRENCY_NOT_FOUND' } }, 404);

    await expect(createFavoritesClient(CLIENT_ID, fetchFunction).add({ kind: 'currency', code: 'XYZ' })).rejects.toThrow(/HTTP 404/);
  });
});
