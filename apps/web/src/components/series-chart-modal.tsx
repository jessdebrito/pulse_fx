import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useCallback, useState, type JSX } from 'react';
import { useAsync, type AsyncState } from '../hooks/use-async';
import { formatPercent } from '../lib/format';
import { defaultSelection, type AvailablePeriod, type PeriodSelection } from '../lib/periods';
import { hasValues, variationPercent, type TimeSeries } from '../lib/series';
import { AppModal } from './app-modal';
import { LineChart } from './line-chart';
import { PeriodPicker } from './period-picker';

export interface SeriesChartModalProps {
  readonly open: boolean;
  readonly title: string;
  readonly onClose: () => void;
  readonly loadAvailability: () => Promise<readonly AvailablePeriod[]>;
  readonly loadSeries: (selection: PeriodSelection) => Promise<TimeSeries>;
}

const CONTENT_SPACING = 2;
const LOAD_ERROR_MESSAGE = 'Não foi possível carregar o gráfico.';

export function SeriesChartModal({ open, title, onClose, loadAvailability, loadSeries }: SeriesChartModalProps): JSX.Element {
  const availability = useAsync(loadAvailability);
  return (
    <AppModal open={open} title={title} onClose={onClose}>
      <AvailabilityContent availability={availability} loadSeries={loadSeries} chartLabel={`Gráfico de ${title}`} />
    </AppModal>
  );
}

interface AvailabilityContentProps {
  readonly availability: AsyncState<readonly AvailablePeriod[]>;
  readonly loadSeries: (selection: PeriodSelection) => Promise<TimeSeries>;
  readonly chartLabel: string;
}

function AvailabilityContent({ availability, loadSeries, chartLabel }: AvailabilityContentProps): JSX.Element {
  if (availability.status === 'loading') return <Typography>Carregando gráfico…</Typography>;
  if (availability.status === 'error') return <Alert severity="error">{LOAD_ERROR_MESSAGE}</Alert>;
  const initialSelection = defaultSelection(availability.data);
  if (initialSelection === null) return <Typography>Sem cotações disponíveis.</Typography>;
  return <PeriodChart available={availability.data} initialSelection={initialSelection} loadSeries={loadSeries} chartLabel={chartLabel} />;
}

interface PeriodChartProps {
  readonly available: readonly AvailablePeriod[];
  readonly initialSelection: PeriodSelection;
  readonly loadSeries: (selection: PeriodSelection) => Promise<TimeSeries>;
  readonly chartLabel: string;
}

function PeriodChart({ available, initialSelection, loadSeries, chartLabel }: PeriodChartProps): JSX.Element {
  const [selection, setSelection] = useState(initialSelection);
  const load = useCallback(() => loadSeries(selection), [loadSeries, selection]);
  const series = useAsync(load);
  return (
    <Stack spacing={CONTENT_SPACING}>
      <PeriodPicker available={available} value={selection} onChange={setSelection} />
      <SeriesContent state={series} chartLabel={chartLabel} />
    </Stack>
  );
}

function SeriesContent({ state, chartLabel }: { readonly state: AsyncState<TimeSeries>; readonly chartLabel: string }): JSX.Element {
  if (state.status === 'loading') return <Typography>Carregando gráfico…</Typography>;
  if (state.status === 'error') return <Alert severity="error">{LOAD_ERROR_MESSAGE}</Alert>;
  if (!hasValues(state.data)) return <Typography>Sem cotações neste período.</Typography>;
  const variation = variationPercent(state.data.datasets[0]?.values ?? []);
  return (
    <>
      {variation !== null && <Typography>{`Variação no período: ${formatPercent(variation)}`}</Typography>}
      <LineChart ariaLabel={chartLabel} series={state.data} />
    </>
  );
}
