import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { formatPercent } from '../lib/format';
import { variationTone, type VariationTone } from '../lib/variation';

const TONE_STYLES: Readonly<Record<VariationTone, { readonly color: string }>> = {
  positive: { color: 'success.main' },
  negative: { color: 'error.main' },
  neutral: { color: 'inherit' },
};

export function VariationPercent({ percent }: { readonly percent: number }): JSX.Element {
  return (
    <Box component="span" sx={TONE_STYLES[variationTone(percent)]}>
      {formatPercent(percent)}
    </Box>
  );
}
