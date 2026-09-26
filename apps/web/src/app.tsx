import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { useCallback, useState, type ComponentType, type JSX, type ReactNode } from 'react';
import { fetchCurrencies, fetchCurrencyPeriods, fetchCurrencyQuotes, type CurrencyPeriods, type CurrencyQuotes, type CurrencySummary } from './api/currencies';
import {
  fetchIndicatorObservations,
  fetchIndicatorPeriods,
  fetchIndicators,
  type IndicatorKey,
  type IndicatorObservations,
  type IndicatorPeriods,
  type IndicatorSummary,
} from './api/indicators';
import { CurrenciesTable } from './components/currencies-table';
import { IndicatorGroups } from './components/indicator-groups';
import type { SeriesChartModalProps } from './components/series-chart-modal';
import { useAsync } from './hooks/use-async';
import { useCurrencies, type CurrenciesLoader, type CurrenciesState } from './hooks/use-currencies';
import { useIndicators, type IndicatorsLoader, type IndicatorsState } from './hooks/use-indicators';
import { displayNameOf } from './lib/indicators';
import { rangeOfSelection, type AvailablePeriod, type DateRange, type Granularity, type PeriodSelection } from './lib/periods';
import { toClosingSeries, toIndicatorSeries, type TimeSeries } from './lib/series';

export type CurrencyQuotesLoader = (code: string, range: DateRange) => Promise<CurrencyQuotes>;

export type CurrencyPeriodsLoader = (code: string) => Promise<CurrencyPeriods>;

export type IndicatorObservationsLoader = (key: IndicatorKey, range: DateRange) => Promise<IndicatorObservations>;

export type IndicatorPeriodsLoader = (key: IndicatorKey) => Promise<IndicatorPeriods>;

export type ChartModalComponent = ComponentType<SeriesChartModalProps>;

export type ChartModalLoader = () => Promise<ChartModalComponent>;

export interface AppProps {
  readonly loadChartModal?: ChartModalLoader;
  readonly loadCurrencies?: CurrenciesLoader;
  readonly loadCurrencyQuotes?: CurrencyQuotesLoader;
  readonly loadCurrencyPeriods?: CurrencyPeriodsLoader;
  readonly loadIndicators?: IndicatorsLoader;
  readonly loadIndicatorObservations?: IndicatorObservationsLoader;
  readonly loadIndicatorPeriods?: IndicatorPeriodsLoader;
}

const INDICATOR_GRANULARITIES: readonly Granularity[] = Object.freeze(['year', 'history']);

const loadSeriesChartModal: ChartModalLoader = () => import('./components/series-chart-modal').then((module) => module.SeriesChartModal);
const SECTION_STYLE = { mb: 4 } as const;

export function App({
  loadChartModal = loadSeriesChartModal,
  loadCurrencies = fetchCurrencies,
  loadCurrencyQuotes = fetchCurrencyQuotes,
  loadCurrencyPeriods = fetchCurrencyPeriods,
  loadIndicators = fetchIndicators,
  loadIndicatorObservations = fetchIndicatorObservations,
  loadIndicatorPeriods = fetchIndicatorPeriods,
}: AppProps): JSX.Element {
  return (
    <Container component="main" maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Pulse FX
      </Typography>
      <CurrenciesSection
        loadChartModal={loadChartModal}
        loadCurrencies={loadCurrencies}
        loadCurrencyQuotes={loadCurrencyQuotes}
        loadCurrencyPeriods={loadCurrencyPeriods}
      />
      <IndicatorsSection
        loadChartModal={loadChartModal}
        loadIndicators={loadIndicators}
        loadIndicatorObservations={loadIndicatorObservations}
        loadIndicatorPeriods={loadIndicatorPeriods}
      />
    </Container>
  );
}

function Section({ title, children }: { readonly title: string; readonly children: ReactNode }): JSX.Element {
  return (
    <Box component="section" sx={SECTION_STYLE}>
      <Typography variant="h5" component="h2" gutterBottom>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

interface CurrenciesSectionProps {
  readonly loadChartModal: ChartModalLoader;
  readonly loadCurrencies: CurrenciesLoader;
  readonly loadCurrencyQuotes: CurrencyQuotesLoader;
  readonly loadCurrencyPeriods: CurrencyPeriodsLoader;
}

function CurrenciesSection({ loadChartModal, loadCurrencies, loadCurrencyQuotes, loadCurrencyPeriods }: CurrenciesSectionProps): JSX.Element {
  const state = useCurrencies(loadCurrencies);
  const [selected, setSelected] = useState<CurrencySummary | null>(null);
  return (
    <Section title="Câmbio (PTAX)">
      <CurrenciesContent state={state} onShowChart={setSelected} />
      {selected !== null && (
        <CurrencyChartModal
          currency={selected}
          loadChartModal={loadChartModal}
          loadCurrencyQuotes={loadCurrencyQuotes}
          loadCurrencyPeriods={loadCurrencyPeriods}
          onClose={() => setSelected(null)}
        />
      )}
    </Section>
  );
}

interface IndicatorsSectionProps {
  readonly loadChartModal: ChartModalLoader;
  readonly loadIndicators: IndicatorsLoader;
  readonly loadIndicatorObservations: IndicatorObservationsLoader;
  readonly loadIndicatorPeriods: IndicatorPeriodsLoader;
}

function IndicatorsSection({ loadChartModal, loadIndicators, loadIndicatorObservations, loadIndicatorPeriods }: IndicatorsSectionProps): JSX.Element {
  const state = useIndicators(loadIndicators);
  const [selected, setSelected] = useState<IndicatorSummary | null>(null);
  return (
    <Section title="Indicadores">
      <IndicatorsContent state={state} onShowChart={setSelected} />
      {selected !== null && (
        <IndicatorChartModal
          indicator={selected}
          loadChartModal={loadChartModal}
          loadIndicatorObservations={loadIndicatorObservations}
          loadIndicatorPeriods={loadIndicatorPeriods}
          onClose={() => setSelected(null)}
        />
      )}
    </Section>
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

interface IndicatorsContentProps {
  readonly state: IndicatorsState;
  readonly onShowChart: (indicator: IndicatorSummary) => void;
}

function IndicatorsContent({ state, onShowChart }: IndicatorsContentProps): JSX.Element {
  if (state.status === 'loading') return <Typography>Carregando indicadores…</Typography>;
  if (state.status === 'error') return <Alert severity="error">Não foi possível carregar os indicadores.</Alert>;
  return <IndicatorGroups indicators={state.indicators} onShowChart={onShowChart} />;
}

interface CurrencyChartModalProps {
  readonly currency: CurrencySummary;
  readonly loadChartModal: ChartModalLoader;
  readonly loadCurrencyQuotes: CurrencyQuotesLoader;
  readonly loadCurrencyPeriods: CurrencyPeriodsLoader;
  readonly onClose: () => void;
}

function CurrencyChartModal({ currency, loadChartModal, loadCurrencyQuotes, loadCurrencyPeriods, onClose }: CurrencyChartModalProps): JSX.Element | null {
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
    <LoadedChartModal
      loadChartModal={loadChartModal}
      open
      title={`${currency.code} — ${currency.name}`}
      onClose={onClose}
      loadAvailability={loadAvailability}
      loadSeries={loadSeries}
    />
  );
}

interface IndicatorChartModalProps {
  readonly indicator: IndicatorSummary;
  readonly loadChartModal: ChartModalLoader;
  readonly loadIndicatorObservations: IndicatorObservationsLoader;
  readonly loadIndicatorPeriods: IndicatorPeriodsLoader;
  readonly onClose: () => void;
}

function IndicatorChartModal({ indicator, loadChartModal, loadIndicatorObservations, loadIndicatorPeriods, onClose }: IndicatorChartModalProps): JSX.Element | null {
  const { source, code } = indicator;
  const title = displayNameOf(indicator);
  const loadSeries = useCallback(
    (selection: PeriodSelection): Promise<TimeSeries> =>
      loadIndicatorObservations({ source, code }, rangeOfSelection(selection)).then((history) => toIndicatorSeries(history.observations, selection, title)),
    [source, code, title, loadIndicatorObservations],
  );
  const loadAvailability = useCallback(
    (): Promise<readonly AvailablePeriod[]> => loadIndicatorPeriods({ source, code }).then((availability) => availability.periods),
    [source, code, loadIndicatorPeriods],
  );
  return (
    <LoadedChartModal
      loadChartModal={loadChartModal}
      open
      title={title}
      onClose={onClose}
      loadAvailability={loadAvailability}
      loadSeries={loadSeries}
      granularities={INDICATOR_GRANULARITIES}
    />
  );
}

interface LoadedChartModalProps extends SeriesChartModalProps {
  readonly loadChartModal: ChartModalLoader;
}

function LoadedChartModal({ loadChartModal, ...modalProps }: LoadedChartModalProps): JSX.Element | null {
  const chartModal = useAsync(loadChartModal);
  if (chartModal.status === 'loading') return null;
  if (chartModal.status === 'error') return <Alert severity="error">Não foi possível abrir o gráfico.</Alert>;
  const ChartModal = chartModal.data;
  return <ChartModal {...modalProps} />;
}
