import { renderHook, waitFor } from '@testing-library/react';
import { useAsync } from '../../../src/hooks/use-async';

describe('useAsync', () => {
  it('should start loading and then expose the data when the loader resolves', async () => {
    const load = (): Promise<string> => Promise.resolve('loaded');

    const { result } = renderHook(() => useAsync(load));

    expect(result.current).toEqual({ status: 'loading' });
    await waitFor(() => expect(result.current).toEqual({ status: 'ready', data: 'loaded' }));
  });

  it('should expose the error message when the loader fails', async () => {
    const load = (): Promise<string> => Promise.reject(new Error('HTTP 500'));

    const { result } = renderHook(() => useAsync(load));

    await waitFor(() => expect(result.current).toEqual({ status: 'error', message: 'HTTP 500' }));
  });

  it('should load again when the loader changes', async () => {
    const first = (): Promise<string> => Promise.resolve('first');
    const second = (): Promise<string> => Promise.resolve('second');

    const { result, rerender } = renderHook(({ load }) => useAsync(load), { initialProps: { load: first } });
    await waitFor(() => expect(result.current).toEqual({ status: 'ready', data: 'first' }));

    rerender({ load: second });

    await waitFor(() => expect(result.current).toEqual({ status: 'ready', data: 'second' }));
  });
});
