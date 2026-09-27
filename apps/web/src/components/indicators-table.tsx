import ShowChartIcon from '@mui/icons-material/ShowChart';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import type { JSX } from 'react';
import type { IndicatorSummary } from '../api/indicators';
import { formatIndicatorValue, formatReferenceDate, frequencyLabel, sourceLabel } from '../lib/format';
import { indicatorLabel } from '../lib/indicators';
import { indicatorVariationFormat } from '../lib/variation';
import { VariationCell } from './variation-cell';

export interface IndicatorsTableProps {
  readonly title: string;
  readonly indicators: readonly IndicatorSummary[];
  readonly onShowChart: (indicator: IndicatorSummary) => void;
}

const EMPTY_CELL = '—';
const NAME_CELL_SPACING = 1;
const NAME_CELL_STYLE = { alignItems: 'center', justifyContent: 'space-between' } as const;

export function IndicatorsTable({ title, indicators, onShowChart }: IndicatorsTableProps): JSX.Element {
  return (
    <TableContainer component={Paper}>
      <Table aria-label={title} size="small">
        <TableHead>
          <TableRow>
            <TableCell>Indicador</TableCell>
            <TableCell>Fonte</TableCell>
            <TableCell>Frequência</TableCell>
            <TableCell>Referência</TableCell>
            <TableCell align="right">Último valor</TableCell>
            <TableCell align="right">Variação</TableCell>
            <TableCell>Unidade</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {indicators.map((indicator) => (
            <IndicatorRow key={`${indicator.source}/${indicator.code}`} indicator={indicator} onShowChart={onShowChart} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

interface IndicatorRowProps {
  readonly indicator: IndicatorSummary;
  readonly onShowChart: (indicator: IndicatorSummary) => void;
}

function IndicatorRow({ indicator, onShowChart }: IndicatorRowProps): JSX.Element {
  const label = indicatorLabel(indicator);
  const displayName = label ?? indicator.name;
  const observation = indicator.latestObservation;
  return (
    <TableRow>
      <TableCell component="th" scope="row">
        <Stack direction="row" spacing={NAME_CELL_SPACING} sx={NAME_CELL_STYLE}>
          <Stack>
            <span>{displayName}</span>
            {label !== null && (
              <Typography variant="caption" color="text.secondary">
                {indicator.name}
              </Typography>
            )}
          </Stack>
          <IconButton size="small" aria-label={`Ver gráfico de ${displayName}`} disabled={observation === null} onClick={() => onShowChart(indicator)}>
            <ShowChartIcon fontSize="small" />
          </IconButton>
        </Stack>
      </TableCell>
      <TableCell>{sourceLabel(indicator.source)}</TableCell>
      <TableCell>{frequencyLabel(indicator.frequency)}</TableCell>
      <TableCell>{observation === null ? EMPTY_CELL : formatReferenceDate(observation.date, indicator.frequency)}</TableCell>
      <TableCell align="right">{observation === null ? EMPTY_CELL : formatIndicatorValue(observation.value)}</TableCell>
      <VariationCell variation={indicator.variation} format={indicatorVariationFormat(indicator.frequency)} />
      <TableCell>{indicator.unit}</TableCell>
    </TableRow>
  );
}
