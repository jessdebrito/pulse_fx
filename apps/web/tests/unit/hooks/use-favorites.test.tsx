import { act, renderHook, waitFor } from '@testing-library/react';
import { useFavorites } from '../../../src/hooks/use-favorites';
import { InMemoryFavoritesClient } from '../../support/api/in-memory-favorites-client';
import { recordedFavorites } from '../../support/api/recorded-favorites';

const USD = { kind: 'currency', code: 'USD' } as const;
const AUD = { kind: 'currency', code: 'AUD' } as const;

async function readyHook(client: InMemoryFavoritesClient): Promise<{ current: ReturnType<typeof useFavorites> }> {
  const { result } = renderHook(() => useFavorites(client));
  await waitFor(() => expect(result.current.status).toBe('ready'));
  return result;
}

describe('useFavorites', () => {
  it('should start loading and then mark the favorites returned by the API', async () => {
    const client = new InMemoryFavoritesClient(recordedFavorites());
    const { result } = renderHook(() => useFavorites(client));

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.isFavorite(USD)).toBe(true);
    expect(result.current.isFavorite(AUD)).toBe(false);
  });

  it('should mark and save the item when toggling one that is not a favorite', async () => {
    const client = new InMemoryFavoritesClient(recordedFavorites());
    const result = await readyHook(client);

    act(() => result.current.toggle(AUD));

    expect(result.current.isFavorite(AUD)).toBe(true);
    await waitFor(() => expect(client.added).toEqual([AUD]));
  });

  it('should unmark and remove the item when toggling a favorite', async () => {
    const client = new InMemoryFavoritesClient(recordedFavorites());
    const result = await readyHook(client);

    act(() => result.current.toggle(USD));

    expect(result.current.isFavorite(USD)).toBe(false);
    await waitFor(() => expect(client.removed).toEqual([USD]));
  });

  it('should restore the previous state and flag the failure when saving fails', async () => {
    const client = new InMemoryFavoritesClient(recordedFavorites());
    client.failSaves = true;
    const result = await readyHook(client);

    act(() => result.current.toggle(AUD));

    await waitFor(() => expect(result.current.saveFailed).toBe(true));
    expect(result.current.isFavorite(AUD)).toBe(false);
  });

  it('should expose the error status when the favorites cannot be loaded', async () => {
    const client = new InMemoryFavoritesClient();
    client.failList = true;

    const { result } = renderHook(() => useFavorites(client));

    await waitFor(() => expect(result.current.status).toBe('error'));
  });
});
