import { fetchIndicators, type IndicatorSummary } from '../api/indicators';
import { useAsync } from './use-async';

export type IndicatorsState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly indicators: readonly IndicatorSummary[] }
  | { readonly status: 'error'; readonly message: string };

export type IndicatorsLoader = () => Promise<IndicatorSummary[]>;

export function useIndicators(load: IndicatorsLoader = fetchIndicators): IndicatorsState {
  const state = useAsync(load);
  return state.status === 'ready' ? { status: 'ready', indicators: state.data } : state;
}
