import Alert from '@mui/material/Alert';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { useCallback, useState, type JSX } from 'react';
import { fetchCurrencies, fetchCurrencyPeriods, fetchCurrencyQuotes, type CurrencyPeriods, type CurrencyQuotes, type CurrencySummary } from './api/currencies';
import { CurrenciesTable } from './components/currencies-table';
import { SeriesChartModal } from './components/series-chart-modal';
import { useCurrencies, type CurrenciesLoader, type CurrenciesState } from './hooks/use-currencies';
import { rangeOfSelection, type AvailablePeriod, type DateRange, type PeriodSelection } from './lib/periods';
import { toClosingSeries, type TimeSeries } from './lib/series';

export type CurrencyQuotesLoader = (code: string, range: DateRange) => Promise<CurrencyQuotes>;

export type CurrencyPeriodsLoader = (code: string) => Promise<CurrencyPeriods>;

export interface AppProps {
  readonly loadCurrencies?: CurrenciesLoader;
  readonly loadCurrencyQuotes?: CurrencyQuotesLoader;
  readonly loadCurrencyPeriods?: CurrencyPeriodsLoader;
}

export function App({
  loadCurrencies = fetchCurrencies,
  loadCurrencyQuotes = fetchCurrencyQuotes,
  loadCurrencyPeriods = fetchCurrencyPeriods,
}: AppProps): JSX.Element {
  const state = useCurrencies(loadCurrencies);
  const [selected, setSelected] = useState<CurrencySummary | null>(null);

  return (
    <Container component="main" maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Pulse FX
      </Typography>
      <CurrenciesContent state={state} onShowChart={setSelected} />
      {selected !== null && (
        <CurrencyChartModal
          currency={selected}
          loadCurrencyQuotes={loadCurrencyQuotes}
          loadCurrencyPeriods={loadCurrencyPeriods}
          onClose={() => setSelected(null)}
        />
      )}
    </Container>
  );
}

interface CurrenciesContentProps {
  readonly state: CurrenciesState;
  readonly onShowChart: (currency: CurrencySummary) => void;
}

function CurrenciesContent({ state, onShowChart }: CurrenciesContentProps): JSX.Element {
  if (state.status === 'loading') return <Typography>Carregando cotações…</Typography>;
  if (state.status === 'error') return <Alert severity="error">Não foi possível carregar as cotações.</Alert>;
  return <CurrenciesTable currencies={state.currencies} onShowChart={onShowChart} />;
}

interface CurrencyChartModalProps {
  readonly currency: CurrencySummary;
  readonly loadCurrencyQuotes: CurrencyQuotesLoader;
  readonly loadCurrencyPeriods: CurrencyPeriodsLoader;
  readonly onClose: () => void;
}

function CurrencyChartModal({ currency, loadCurrencyQuotes, loadCurrencyPeriods, onClose }: CurrencyChartModalProps): JSX.Element {
  const loadSeries = useCallback(
    (selection: PeriodSelection): Promise<TimeSeries> =>
      loadCurrencyQuotes(currency.code, rangeOfSelection(selection)).then((history) => toClosingSeries(history.quotes, selection)),
    [currency.code, loadCurrencyQuotes],
  );
  const loadAvailability = useCallback(
    (): Promise<readonly AvailablePeriod[]> => loadCurrencyPeriods(currency.code).then((availability) => availability.periods),
    [currency.code, loadCurrencyPeriods],
  );
  return (
    <SeriesChartModal
      open
      title={`${currency.code} — ${currency.name}`}
      onClose={onClose}
      loadAvailability={loadAvailability}
      loadSeries={loadSeries}
    />
  );
}
