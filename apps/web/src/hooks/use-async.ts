import { useEffect, useState } from 'react';

export type AsyncState<T> =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly data: T }
  | { readonly status: 'error'; readonly message: string };

interface SettledLoad<T> {
  readonly load: () => Promise<T>;
  readonly state: AsyncState<T>;
}

const LOADING = { status: 'loading' } as const;

export function useAsync<T>(load: () => Promise<T>): AsyncState<T> {
  const [settled, setSettled] = useState<SettledLoad<T> | null>(null);

  useEffect(() => {
    let isActive = true;
    void load()
      .then((data) => {
        if (isActive) setSettled({ load, state: { status: 'ready', data } });
      })
      .catch((error: unknown) => {
        if (isActive) setSettled({ load, state: { status: 'error', message: error instanceof Error ? error.message : String(error) } });
      });
    return (): void => {
      isActive = false;
    };
  }, [load]);

  return settled !== null && settled.load === load ? settled.state : LOADING;
}
