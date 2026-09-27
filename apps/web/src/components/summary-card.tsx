import ShowChartIcon from '@mui/icons-material/ShowChart';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { JSX, ReactNode } from 'react';
import type { IndicatorFrequency } from '../api/indicators';
import type { TrendPoint, Variation } from '../api/schemas';
import { describeTrend } from '../lib/sparkline';
import { describeVariationBase, variationBasisLabel, type VariationFormat } from '../lib/variation';
import { FavoriteButton } from './favorite-button';
import { Sparkline } from './sparkline';
import { VariationPercent } from './variation-percent';

export interface SummaryCardHeading {
  readonly title: string;
  readonly subtitle: string | null;
  readonly level: 'h3' | 'h4';
}

export interface SummaryCardProps {
  readonly heading: SummaryCardHeading;
  readonly actions: ReactNode;
  readonly children: ReactNode;
}

export interface SeriesActionsProps {
  readonly name: string;
  readonly favorite: boolean;
  readonly chartDisabled: boolean;
  readonly onToggleFavorite: () => void;
  readonly onShowChart: () => void;
}

export interface SummaryVariationProps {
  readonly variation: Variation | null;
  readonly frequency: IndicatorFrequency;
  readonly format: VariationFormat;
}

const GRID_STYLE = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: 2,
  listStyle: 'none',
  m: 0,
  p: 0,
} as const;
const CONTENT_SPACING = 1;
const CONTENT_STYLE = { pt: 0 } as const;
const NO_BASE_TEXT = 'Sem base de comparação';

export function CardGrid({ label, children }: { readonly label: string; readonly children: ReactNode }): JSX.Element {
  return (
    <Box component="ul" aria-label={label} sx={GRID_STYLE}>
      {children}
    </Box>
  );
}

export function SummaryCard({ heading, actions, children }: SummaryCardProps): JSX.Element {
  return (
    <Card component="li" variant="outlined">
      <CardHeader
        title={heading.title}
        subheader={heading.subtitle}
        action={actions}
        slotProps={{ title: { component: heading.level, variant: 'h6' }, subheader: { variant: 'body2' } }}
      />
      <CardContent sx={CONTENT_STYLE}>
        <Stack spacing={CONTENT_SPACING}>{children}</Stack>
      </CardContent>
    </Card>
  );
}

export function SeriesActions({ name, favorite, chartDisabled, onToggleFavorite, onShowChart }: SeriesActionsProps): JSX.Element {
  return (
    <Stack direction="row">
      <FavoriteButton name={name} active={favorite} onToggle={onToggleFavorite} />
      <IconButton size="small" aria-label={`Ver gráfico de ${name}`} disabled={chartDisabled} onClick={onShowChart}>
        <ShowChartIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}

export function SummaryValue({ value, caption }: { readonly value: string; readonly caption: string }): JSX.Element {
  return (
    <Box>
      <Typography variant="h5" component="p">
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {caption}
      </Typography>
    </Box>
  );
}

export function SummaryNote({ text }: { readonly text: string }): JSX.Element {
  return (
    <Typography variant="body2" color="text.secondary">
      {text}
    </Typography>
  );
}

export function SummaryTrend({ trend, format }: { readonly trend: readonly TrendPoint[]; readonly format: VariationFormat }): JSX.Element | null {
  return <Sparkline values={trend.map((point) => point.value)} label={describeTrend(trend, format)} />;
}

export function SummaryVariation({ variation, frequency, format }: SummaryVariationProps): JSX.Element {
  if (variation === null) return <SummaryNote text={NO_BASE_TEXT} />;
  return (
    <Box>
      <Typography>
        <VariationPercent percent={variation.percent} />
        {` em ${variationBasisLabel(variation.rule, frequency)}`}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {describeVariationBase(variation, format)}
      </Typography>
    </Box>
  );
}
