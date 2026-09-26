import { renderHook, waitFor } from '@testing-library/react';
import { useCurrencies, type CurrenciesLoader } from '../../../src/hooks/use-currencies';
import { recordedCurrencySummaries } from '../../support/api/recorded-currencies';

describe('useCurrencies', () => {
  it('should start loading and then expose the currencies when the loader resolves', async () => {
    const currencies = recordedCurrencySummaries();
    const load: CurrenciesLoader = () => Promise.resolve(currencies);

    const { result } = renderHook(() => useCurrencies(load));

    expect(result.current).toEqual({ status: 'loading' });
    await waitFor(() => expect(result.current).toEqual({ status: 'ready', currencies }));
  });

  it('should expose the error message when the loader fails', async () => {
    const load: CurrenciesLoader = () => Promise.reject(new Error('GET /api/currencies responded with HTTP 500'));

    const { result } = renderHook(() => useCurrencies(load));

    await waitFor(() => expect(result.current).toEqual({ status: 'error', message: 'GET /api/currencies responded with HTTP 500' }));
  });
});
