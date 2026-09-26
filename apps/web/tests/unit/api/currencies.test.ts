import { fetchCurrencies, fetchCurrencyPeriods, fetchCurrencyQuotes, type FetchFunction } from '../../../src/api/currencies';
import {
  jsonResponse,
  recordedCurrenciesResponse,
  recordedCurrencySummaries,
  recordedUsdPeriods,
  recordedUsdPeriodsResponse,
  recordedUsdQuotes,
  recordedUsdQuotesResponse,
} from '../../support/api/recorded-currencies';

describe('fetchCurrencies', () => {
  it('should return the currencies parsed from the API when it answers 200', async () => {
    const fetchFunction = jest.fn<ReturnType<FetchFunction>, Parameters<FetchFunction>>().mockResolvedValue(jsonResponse(recordedCurrenciesResponse()));

    const currencies = await fetchCurrencies(fetchFunction);

    expect(currencies).toEqual(recordedCurrencySummaries());
    expect(currencies.find((currency) => currency.code === 'USD')?.latestQuote?.ask).toBe(5.1991);
  });

  it('should request the currencies route when loading', async () => {
    const fetchFunction = jest.fn<ReturnType<FetchFunction>, Parameters<FetchFunction>>().mockResolvedValue(jsonResponse(recordedCurrenciesResponse()));

    await fetchCurrencies(fetchFunction);

    expect(fetchFunction).toHaveBeenCalledWith('/api/currencies');
  });

  it('should throw naming the status when the API responds with an error', async () => {
    const fetchFunction: FetchFunction = () => Promise.resolve(jsonResponse({ error: { code: 'INTERNAL_ERROR' } }, 500));

    await expect(fetchCurrencies(fetchFunction)).rejects.toThrow(/HTTP 500/);
  });

  it('should throw when the payload does not match the expected format', async () => {
    const fetchFunction: FetchFunction = () => Promise.resolve(jsonResponse([{ code: 'USD' }]));

    await expect(fetchCurrencies(fetchFunction)).rejects.toThrow();
  });
});

describe('fetchCurrencyQuotes', () => {
  const THIS_YEAR = { from: '2026-01-01', to: '2026-09-25' };

  it('should request the quotes of the currency for the period when loading', async () => {
    const fetchFunction = jest.fn<ReturnType<FetchFunction>, Parameters<FetchFunction>>().mockResolvedValue(jsonResponse(recordedUsdQuotesResponse()));

    await fetchCurrencyQuotes('USD', THIS_YEAR, fetchFunction);

    expect(fetchFunction).toHaveBeenCalledWith('/api/currencies/USD/quotes?from=2026-01-01&to=2026-09-25');
  });

  it('should return the quotes parsed from the API when it answers 200', async () => {
    const fetchFunction: FetchFunction = () => Promise.resolve(jsonResponse(recordedUsdQuotesResponse()));

    await expect(fetchCurrencyQuotes('USD', THIS_YEAR, fetchFunction)).resolves.toEqual(recordedUsdQuotes());
  });

  it('should throw naming the status when the API responds with an error', async () => {
    const fetchFunction: FetchFunction = () => Promise.resolve(jsonResponse({ error: { code: 'CURRENCY_NOT_FOUND' } }, 404));

    await expect(fetchCurrencyQuotes('XYZ', THIS_YEAR, fetchFunction)).rejects.toThrow(/HTTP 404/);
  });
});

describe('fetchCurrencyPeriods', () => {
  it('should request the periods route of the currency and return the parsed periods when the API answers 200', async () => {
    const fetchFunction = jest.fn<ReturnType<FetchFunction>, Parameters<FetchFunction>>().mockResolvedValue(jsonResponse(recordedUsdPeriodsResponse()));

    await expect(fetchCurrencyPeriods('USD', fetchFunction)).resolves.toEqual(recordedUsdPeriods());
    expect(fetchFunction).toHaveBeenCalledWith('/api/currencies/USD/periods');
  });

  it('should throw naming the status when the API responds with an error', async () => {
    const fetchFunction: FetchFunction = () => Promise.resolve(jsonResponse({ error: { code: 'CURRENCY_NOT_FOUND' } }, 404));

    await expect(fetchCurrencyPeriods('XYZ', fetchFunction)).rejects.toThrow(/HTTP 404/);
  });
});
