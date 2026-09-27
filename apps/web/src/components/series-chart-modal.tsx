import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useCallback, useId, useState, type JSX } from 'react';
import { useAsync, type AsyncState } from '../hooks/use-async';
import { CALENDAR_GRANULARITIES, defaultSelection, type AvailablePeriod, type Granularity, type PeriodSelection, type WindowSelection } from '../lib/periods';
import { hasValues, type TimeSeries } from '../lib/series';
import { AppModal } from './app-modal';
import { LineChart } from './line-chart';
import { PeriodPicker } from './period-picker';

export interface SeriesChartModalProps {
  readonly open: boolean;
  readonly title: string;
  readonly onClose: () => void;
  readonly loadAvailability: () => Promise<readonly AvailablePeriod[]>;
  readonly loadSeries: (selection: PeriodSelection) => Promise<TimeSeries>;
  readonly granularities?: readonly Granularity[];
  readonly defaultWindow: WindowSelection | null;
  readonly variationText: string;
  readonly reason: string | null;
  readonly limitations: readonly string[];
}

interface ChartSettings {
  readonly loadSeries: (selection: PeriodSelection) => Promise<TimeSeries>;
  readonly chartLabel: string;
  readonly granularities: readonly Granularity[];
  readonly defaultWindow: WindowSelection | null;
}

const CONTENT_SPACING = 2;
const LOAD_ERROR_MESSAGE = 'Não foi possível carregar o gráfico.';
const LIMITATIONS_LIST_STYLE = { m: 0, pl: 3 } as const;

export function SeriesChartModal({
  open,
  title,
  onClose,
  loadAvailability,
  loadSeries,
  granularities = CALENDAR_GRANULARITIES,
  defaultWindow,
  variationText,
  reason,
  limitations,
}: SeriesChartModalProps): JSX.Element {
  const availability = useAsync(loadAvailability);
  const settings: ChartSettings = { loadSeries, chartLabel: `Gráfico de ${title}`, granularities, defaultWindow };
  return (
    <AppModal open={open} title={title} onClose={onClose}>
      <Stack spacing={CONTENT_SPACING}>
        <Typography>{variationText}</Typography>
        <AvailabilityContent availability={availability} settings={settings} />
        <ReasonSection reason={reason} />
        <LimitationsList limitations={limitations} />
      </Stack>
    </AppModal>
  );
}

interface AvailabilityContentProps {
  readonly availability: AsyncState<readonly AvailablePeriod[]>;
  readonly settings: ChartSettings;
}

function AvailabilityContent({ availability, settings }: AvailabilityContentProps): JSX.Element {
  if (availability.status === 'loading') return <Typography>Carregando gráfico…</Typography>;
  if (availability.status === 'error') return <Alert severity="error">{LOAD_ERROR_MESSAGE}</Alert>;
  const latestYearSelection = defaultSelection(availability.data);
  if (latestYearSelection === null) return <Typography>Sem dados disponíveis.</Typography>;
  return <PeriodChart available={availability.data} initialSelection={settings.defaultWindow ?? latestYearSelection} settings={settings} />;
}

interface PeriodChartProps {
  readonly available: readonly AvailablePeriod[];
  readonly initialSelection: PeriodSelection;
  readonly settings: ChartSettings;
}

function PeriodChart({ available, initialSelection, settings }: PeriodChartProps): JSX.Element {
  const [selection, setSelection] = useState(initialSelection);
  const { loadSeries } = settings;
  const load = useCallback(() => loadSeries(selection), [loadSeries, selection]);
  const series = useAsync(load);
  return (
    <Stack spacing={CONTENT_SPACING}>
      <PeriodPicker available={available} value={selection} onChange={setSelection} granularities={settings.granularities} defaultWindow={settings.defaultWindow} />
      <SeriesContent state={series} chartLabel={settings.chartLabel} />
    </Stack>
  );
}

function SeriesContent({ state, chartLabel }: { readonly state: AsyncState<TimeSeries>; readonly chartLabel: string }): JSX.Element {
  if (state.status === 'loading') return <Typography>Carregando gráfico…</Typography>;
  if (state.status === 'error') return <Alert severity="error">{LOAD_ERROR_MESSAGE}</Alert>;
  if (!hasValues(state.data)) return <Typography>Sem dados neste período.</Typography>;
  return <LineChart ariaLabel={chartLabel} series={state.data} />;
}

function ReasonSection({ reason }: { readonly reason: string | null }): JSX.Element | null {
  const headingId = useId();
  if (reason === null) return null;
  return (
    <Box component="section" aria-labelledby={headingId}>
      <Typography id={headingId} variant="subtitle2" component="h3">
        Por que acompanhar
      </Typography>
      <Typography variant="body2">{reason}</Typography>
    </Box>
  );
}

function LimitationsList({ limitations }: { readonly limitations: readonly string[] }): JSX.Element | null {
  const headingId = useId();
  if (limitations.length === 0) return null;
  return (
    <Box component="section">
      <Typography id={headingId} variant="subtitle2" component="h3">
        Observações
      </Typography>
      <Box component="ul" aria-labelledby={headingId} sx={LIMITATIONS_LIST_STYLE}>
        {limitations.map((limitation) => (
          <Typography key={limitation} component="li" variant="body2" color="text.secondary">
            {limitation}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}
