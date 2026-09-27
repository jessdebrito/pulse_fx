import Box from '@mui/material/Box';
import type { JSX } from 'react';
import { SPARKLINE_SIZE, sparklinePoints } from '../lib/sparkline';

export interface SparklineProps {
  readonly values: readonly number[];
  readonly label: string;
}

const CONTAINER_STYLE = { color: 'primary.main' } as const;
const SVG_STYLE = { display: 'block', width: '100%', height: 40 } as const;
const STROKE_WIDTH = 1.5;

export function Sparkline({ values, label }: SparklineProps): JSX.Element | null {
  const points = sparklinePoints(values);
  if (points === '') return null;
  return (
    <Box sx={CONTAINER_STYLE}>
      <svg role="img" aria-label={label} viewBox={`0 0 ${SPARKLINE_SIZE.width} ${SPARKLINE_SIZE.height}`} preserveAspectRatio="none" style={SVG_STYLE}>
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth={STROKE_WIDTH} vectorEffect="non-scaling-stroke" />
      </svg>
    </Box>
  );
}
