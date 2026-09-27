import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
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
import type { FavoritesClient } from './api/favorites';
import { CurrenciesTable } from './components/currencies-table';
import { CurrencyCards } from './components/currency-cards';
import { Disclaimer } from './components/disclaimer';
import { IndicatorGroups } from './components/indicator-groups';
import { LayoutToggle, type DashboardLayout } from './components/layout-toggle';
import type { SeriesChartModalProps } from './components/series-chart-modal';
import { useAsync } from './hooks/use-async';
import { useCurrencies, type CurrenciesLoader, type CurrenciesState } from './hooks/use-currencies';
import { useFavorites, type FavoritesView } from './hooks/use-favorites';
import { useIndicators, type IndicatorsLoader, type IndicatorsState } from './hooks/use-indicators';
import { currencyFavorite, favoriteCurrencies, favoriteIndicators, indicatorFavorite } from './lib/favorites';
import { displayNameOf } from './lib/indicators';
import { currencyLimitations, indicatorLimitations } from './lib/limitations';
import { CURRENCY_VARIATION_FORMAT, describeVariation, indicatorVariationFormat } from './lib/variation';
import { rangeOfSelection, windowSelection, type AvailablePeriod, type DateRange, type Granularity, type PeriodSelection } from './lib/periods';
import { toClosingSeries, toIndicatorSeries, type TimeSeries } from './lib/series';

export type CurrencyQuotesLoader = (code: string, range: DateRange) => Promise<CurrencyQuotes>;

export type CurrencyPeriodsLoader = (code: string) => Promise<CurrencyPeriods>;

export type IndicatorObservationsLoader = (key: IndicatorKey, range: DateRange) => Promise<IndicatorObservations>;

export type IndicatorPeriodsLoader = (key: IndicatorKey) => Promise<IndicatorPeriods>;

export type ChartModalComponent = ComponentType<SeriesChartModalProps>;

export type ChartModalLoader = () => Promise<ChartModalComponent>;

export interface AppProps {
  readonly favoritesClient: FavoritesClient;
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
const PAGE_STYLE = { pt: 4, pb: 12 } as const;
const SECTION_STYLE = { mb: 4 } as const;
const DASHBOARD_BAR_STYLE = { mb: 2 } as const;
const DASHBOARD_CONTROLS_STYLE = { alignItems: 'center', flexWrap: 'wrap' } as const;

interface DashboardSettings {
  readonly favorites: FavoritesView;
  readonly onlyFavorites: boolean;
  readonly layout: DashboardLayout;
}

interface DashboardBarProps {
  readonly settings: DashboardSettings;
  readonly onOnlyFavoritesChange: (onlyFavorites: boolean) => void;
  readonly onLayoutChange: (layout: DashboardLayout) => void;
}

export function App({
  favoritesClient,
  loadChartModal = loadSeriesChartModal,
  loadCurrencies = fetchCurrencies,
  loadCurrencyQuotes = fetchCurrencyQuotes,
  loadCurrencyPeriods = fetchCurrencyPeriods,
  loadIndicators = fetchIndicators,
  loadIndicatorObservations = fetchIndicatorObservations,
  loadIndicatorPeriods = fetchIndicatorPeriods,
}: AppProps): JSX.Element {
  const favorites = useFavorites(favoritesClient);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [layout, setLayout] = useState<DashboardLayout>('cards');
  const settings: DashboardSettings = { favorites, onlyFavorites, layout };
  return (
    <>
      <Container component="main" maxWidth="lg" sx={PAGE_STYLE}>
        <Typography variant="h4" component="h1" gutterBottom>
          Pulse FX
        </Typography>
        <DashboardBar settings={settings} onOnlyFavoritesChange={setOnlyFavorites} onLayoutChange={setLayout} />
        <CurrenciesSection
          settings={settings}
          loadChartModal={loadChartModal}
          loadCurrencies={loadCurrencies}
          loadCurrencyQuotes={loadCurrencyQuotes}
          loadCurrencyPeriods={loadCurrencyPeriods}
        />
        <IndicatorsSection
          settings={settings}
          loadChartModal={loadChartModal}
          loadIndicators={loadIndicators}
          loadIndicatorObservations={loadIndicatorObservations}
          loadIndicatorPeriods={loadIndicatorPeriods}
        />
      </Container>
      <Disclaimer />
    </>
  );
}

function DashboardBar({ settings, onOnlyFavoritesChange, onLayoutChange }: DashboardBarProps): JSX.Element {
  return (
    <Stack spacing={1} sx={DASHBOARD_BAR_STYLE}>
      <Stack direction="row" spacing={2} sx={DASHBOARD_CONTROLS_STYLE}>
        <LayoutToggle value={settings.layout} onChange={onLayoutChange} />
        <FormControlLabel
          control={<Switch checked={settings.onlyFavorites} onChange={(event) => onOnlyFavoritesChange(event.target.checked)} />}
          label="Mostrar só meus favoritos"
        />
      </Stack>
      {settings.favorites.status === 'error' && <Alert severity="error">Não foi possível carregar os favoritos.</Alert>}
      {settings.favorites.saveFailed && <Alert severity="error">Não foi possível salvar o favorito.</Alert>}
    </Stack>
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
  readonly settings: DashboardSettings;
  readonly loadChartModal: ChartModalLoader;
  readonly loadCurrencies: CurrenciesLoader;
  readonly loadCurrencyQuotes: CurrencyQuotesLoader;
  readonly loadCurrencyPeriods: CurrencyPeriodsLoader;
}

function CurrenciesSection({ settings, loadChartModal, loadCurrencies, loadCurrencyQuotes, loadCurrencyPeriods }: CurrenciesSectionProps): JSX.Element {
  const state = useCurrencies(loadCurrencies);
  const [selected, setSelected] = useState<CurrencySummary | null>(null);
  return (
    <Section title="Câmbio (PTAX)">
      <CurrenciesContent state={state} settings={settings} onShowChart={setSelected} />
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
  readonly settings: DashboardSettings;
  readonly loadChartModal: ChartModalLoader;
  readonly loadIndicators: IndicatorsLoader;
  readonly loadIndicatorObservations: IndicatorObservationsLoader;
  readonly loadIndicatorPeriods: IndicatorPeriodsLoader;
}

function IndicatorsSection({ settings, loadChartModal, loadIndicators, loadIndicatorObservations, loadIndicatorPeriods }: IndicatorsSectionProps): JSX.Element {
  const state = useIndicators(loadIndicators);
  const [selected, setSelected] = useState<IndicatorSummary | null>(null);
  return (
    <Section title="Indicadores">
      <IndicatorsContent state={state} settings={settings} onShowChart={setSelected} />
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
  readonly settings: DashboardSettings;
  readonly onShowChart: (currency: CurrencySummary) => void;
}

function CurrenciesContent({ state, settings, onShowChart }: CurrenciesContentProps): JSX.Element {
  if (state.status === 'loading') return <Typography>Carregando cotações…</Typography>;
  if (state.status === 'error') return <Alert severity="error">Não foi possível carregar as cotações.</Alert>;
  const currencies = settings.onlyFavorites ? favoriteCurrencies(state.currencies, settings.favorites.favorites) : state.currencies;
  if (currencies.length === 0 && settings.onlyFavorites) return <Typography>Nenhuma moeda favorita.</Typography>;
  const Listing = settings.layout === 'cards' ? CurrencyCards : CurrenciesTable;
  return (
    <Listing
      currencies={currencies}
      onShowChart={onShowChart}
      isFavorite={(currency) => settings.favorites.isFavorite(currencyFavorite(currency))}
      onToggleFavorite={(currency) => settings.favorites.toggle(currencyFavorite(currency))}
    />
  );
}

interface IndicatorsContentProps {
  readonly state: IndicatorsState;
  readonly settings: DashboardSettings;
  readonly onShowChart: (indicator: IndicatorSummary) => void;
}

function IndicatorsContent({ state, settings, onShowChart }: IndicatorsContentProps): JSX.Element {
  if (state.status === 'loading') return <Typography>Carregando indicadores…</Typography>;
  if (state.status === 'error') return <Alert severity="error">Não foi possível carregar os indicadores.</Alert>;
  const indicators = settings.onlyFavorites ? favoriteIndicators(state.indicators, settings.favorites.favorites) : state.indicators;
  if (indicators.length === 0 && settings.onlyFavorites) return <Typography>Nenhum indicador favorito.</Typography>;
  return (
    <IndicatorGroups
      layout={settings.layout}
      indicators={indicators}
      onShowChart={onShowChart}
      isFavorite={(indicator) => settings.favorites.isFavorite(indicatorFavorite(indicator))}
      onToggleFavorite={(indicator) => settings.favorites.toggle(indicatorFavorite(indicator))}
    />
  );
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
      defaultWindow={windowSelection('daily', currency.latestQuote?.quoteDate ?? null)}
      variationText={describeVariation(currency.variation, 'daily', CURRENCY_VARIATION_FORMAT)}
      limitations={currencyLimitations()}
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
      defaultWindow={windowSelection(indicator.frequency, indicator.latestObservation?.date ?? null)}
      variationText={describeVariation(indicator.variation, indicator.frequency, indicatorVariationFormat(indicator.frequency))}
      limitations={indicatorLimitations(indicator)}
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
