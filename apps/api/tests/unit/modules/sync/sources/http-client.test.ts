import { FetchHttpClient, type FetchFunction } from '../../../../../src/modules/sync/sources/http-client';
import { ExternalSourceError } from '../../../../../src/modules/sync/sync.errors';

const URL = 'https://example.test/data';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function buildClient(fetchFunction: FetchFunction, sleep = jest.fn(() => Promise.resolve())): FetchHttpClient {
  return new FetchHttpClient({ timeoutMs: 1_000, maxAttempts: 3, retryDelayMs: 500, fetchFunction, sleep });
}

describe('FetchHttpClient', () => {
  it('should return the parsed JSON when the response is 200', async () => {
    const fetchFunction = jest.fn<Promise<Response>, Parameters<FetchFunction>>().mockResolvedValue(jsonResponse({ value: [] }));

    await expect(buildClient(fetchFunction).getJson(URL)).resolves.toEqual({ value: [] });
    expect(fetchFunction).toHaveBeenCalledTimes(1);
    expect(fetchFunction.mock.calls[0]?.[0]).toBe(URL);
  });

  it('should retry after the retry delay when an attempt fails', async () => {
    const fetchFunction = jest
      .fn<Promise<Response>, Parameters<FetchFunction>>()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    const sleep = jest.fn(() => Promise.resolve());

    await expect(buildClient(fetchFunction, sleep).getJson(URL)).resolves.toEqual({ ok: true });
    expect(fetchFunction).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(500);
  });

  it('should throw ExternalSourceError when every attempt returns a non-2xx status', async () => {
    const fetchFunction = jest
      .fn<Promise<Response>, Parameters<FetchFunction>>()
      .mockImplementation(() => Promise.resolve(jsonResponse({}, 503)));

    await expect(buildClient(fetchFunction).getJson(URL)).rejects.toThrow(ExternalSourceError);
    expect(fetchFunction).toHaveBeenCalledTimes(3);
  });

  it('should abort the request and throw ExternalSourceError when the server takes longer than the timeout', async () => {
    const neverAnswers: FetchFunction = (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(new Error('aborted by timeout')));
      });
    const client = new FetchHttpClient({ timeoutMs: 20, maxAttempts: 1, retryDelayMs: 0, fetchFunction: neverAnswers });

    await expect(client.getJson(URL)).rejects.toThrow(ExternalSourceError);
  });
});
