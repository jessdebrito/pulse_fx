import Stack from '@mui/material/Stack';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import type { JSX } from 'react';
import type { Variation } from '../api/schemas';
import { describeVariationBase, type VariationFormat } from '../lib/variation';
import { VariationPercent } from './variation-percent';

export interface VariationCellProps {
  readonly variation: Variation | null;
  readonly format: VariationFormat;
}

const EMPTY_CELL = '—';
const CELL_STYLE = { alignItems: 'flex-end' } as const;

export function VariationCell({ variation, format }: VariationCellProps): JSX.Element {
  if (variation === null) return <TableCell align="right">{EMPTY_CELL}</TableCell>;
  return (
    <TableCell align="right">
      <Stack sx={CELL_STYLE}>
        <VariationPercent percent={variation.percent} />
        <Typography variant="caption" color="text.secondary">
          {describeVariationBase(variation, format)}
        </Typography>
      </Stack>
    </TableCell>
  );
}
