import { render, screen } from '@testing-library/react';
import { LineChart } from '../../../src/components/line-chart';
import { toClosingSeries } from '../../../src/lib/series';
import { recordedUsdQuotes } from '../../support/api/recorded-currencies';
import { createdCharts } from '../../support/mocks/chart-js';

describe('LineChart', () => {
  const quotes = recordedUsdQuotes().quotes;
  const monthly = toClosingSeries(quotes, { granularity: 'month', year: 2026, month: 9 });

  it('should draw a line chart with the series labels and datasets on an accessible canvas', () => {
    render(<LineChart ariaLabel="Cotação do USD" series={monthly} />);

    expect(screen.getByRole('img', { name: 'Cotação do USD' })).toBeInTheDocument();
    expect(createdCharts).toHaveLength(1);
    const config = createdCharts[0]?.config;
    expect(config?.type).toBe('line');
    expect(config?.data.labels).toEqual(monthly.labels);
    expect(config?.data.datasets.map((dataset) => [dataset.label, dataset.data])).toEqual(
      monthly.datasets.map((dataset) => [dataset.label, dataset.values]),
    );
  });

  it('should connect the line across days without data when drawing', () => {
    render(<LineChart ariaLabel="Cotação do USD" series={monthly} />);

    expect(createdCharts[0]?.config.options?.spanGaps).toBe(true);
  });

  it('should destroy the chart when unmounted', () => {
    const { unmount } = render(<LineChart ariaLabel="Cotação do USD" series={monthly} />);

    unmount();

    expect(createdCharts[0]?.destroy).toHaveBeenCalledTimes(1);
  });

  it('should replace the chart when the series changes', () => {
    const { rerender } = render(<LineChart ariaLabel="Cotação do USD" series={monthly} />);

    rerender(<LineChart ariaLabel="Cotação do USD" series={toClosingSeries(quotes, { granularity: 'year', year: 2026 })} />);

    expect(createdCharts).toHaveLength(2);
    expect(createdCharts[0]?.destroy).toHaveBeenCalledTimes(1);
    expect(createdCharts[1]?.config.data.labels).toHaveLength(12);
  });
});
