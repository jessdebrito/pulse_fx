import { fetchCurrencies, type CurrencySummary } from '../api/currencies';
import { useAsync } from './use-async';

export type CurrenciesState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly currencies: readonly CurrencySummary[] }
  | { readonly status: 'error'; readonly message: string };

export type CurrenciesLoader = () => Promise<CurrencySummary[]>;

export function useCurrencies(load: CurrenciesLoader = fetchCurrencies): CurrenciesState {
  const state = useAsync(load);
  return state.status === 'ready' ? { status: 'ready', currencies: state.data } : state;
}
