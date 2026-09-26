import { renderHook, waitFor } from '@testing-library/react';
import { useIndicators, type IndicatorsLoader } from '../../../src/hooks/use-indicators';
import { recordedIndicatorSummaries } from '../../support/api/recorded-indicators';

describe('useIndicators', () => {
  it('should start loading and then expose the indicators when the loader resolves', async () => {
    const indicators = recordedIndicatorSummaries();
    const load: IndicatorsLoader = () => Promise.resolve(indicators);

    const { result } = renderHook(() => useIndicators(load));

    expect(result.current).toEqual({ status: 'loading' });
    await waitFor(() => expect(result.current).toEqual({ status: 'ready', indicators }));
  });

  it('should expose the error message when the loader fails', async () => {
    const load: IndicatorsLoader = () => Promise.reject(new Error('GET /api/indicators responded with HTTP 500'));

    const { result } = renderHook(() => useIndicators(load));

    await waitFor(() => expect(result.current).toEqual({ status: 'error', message: 'GET /api/indicators responded with HTTP 500' }));
  });
});
