import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { JSX } from 'react';
import type { IndicatorSummary } from '../api/indicators';
import { groupByTheme } from '../lib/indicators';
import { IndicatorsTable } from './indicators-table';

export interface IndicatorGroupsProps {
  readonly indicators: readonly IndicatorSummary[];
  readonly onShowChart: (indicator: IndicatorSummary) => void;
}

const GROUP_SPACING = 3;

export function IndicatorGroups({ indicators, onShowChart }: IndicatorGroupsProps): JSX.Element {
  const themes = groupByTheme(indicators);
  if (themes.length === 0) return <Typography>Nenhum indicador sincronizado ainda.</Typography>;
  return (
    <Stack spacing={GROUP_SPACING}>
      {themes.map((theme) => (
        <Box key={theme.title} component="section">
          <Typography variant="h6" component="h3" gutterBottom>
            {theme.title}
          </Typography>
          <IndicatorsTable title={theme.title} indicators={theme.indicators} onShowChart={onShowChart} />
        </Box>
      ))}
    </Stack>
  );
}
