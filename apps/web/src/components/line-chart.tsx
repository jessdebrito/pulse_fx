import {
  CategoryScale,
  Chart,
  Colors,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { useEffect, useRef, type JSX } from 'react';
import type { TimeSeries } from '../lib/series';

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend, Colors);

export interface LineChartProps {
  readonly ariaLabel: string;
  readonly series: TimeSeries;
}

export function LineChart({ ariaLabel, series }: LineChartProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return undefined;
    const chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: [...series.labels],
        datasets: series.datasets.map((dataset) => ({ label: dataset.label, data: [...dataset.values] })),
      },
      options: { responsive: true, spanGaps: true, interaction: { mode: 'index', intersect: false } },
    });
    return (): void => {
      chart.destroy();
    };
  }, [series]);

  return <canvas ref={canvasRef} role="img" aria-label={ariaLabel} />;
}
