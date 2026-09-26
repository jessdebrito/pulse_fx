import { fireEvent, render, screen } from '@testing-library/react';
import { SeriesChartModal } from '../../../src/components/series-chart-modal';
import type { AvailablePeriod, PeriodSelection } from '../../../src/lib/periods';
import { toClosingSeries, type TimeSeries } from '../../../src/lib/series';
import { recordedUsdPeriods, recordedUsdQuotes } from '../../support/api/recorded-currencies';
import { createdCharts } from '../../support/mocks/chart-js';

function renderModal(loadAvailability: () => Promise<readonly AvailablePeriod[]>, loadSeries: (selection: PeriodSelection) => Promise<TimeSeries>): void {
  render(
    <SeriesChartModal open title="USD — Dólar dos Estados Unidos" onClose={jest.fn()} loadAvailability={loadAvailability} loadSeries={loadSeries} />,
  );
}

const realAvailability = (): Promise<readonly AvailablePeriod[]> => Promise.resolve(recordedUsdPeriods().periods);

function closingSeriesLoader(): jest.Mock<Promise<TimeSeries>, [PeriodSelection]> {
  return jest.fn<Promise<TimeSeries>, [PeriodSelection]>().mockImplementation((selection) => Promise.resolve(toClosingSeries(recordedUsdQuotes().quotes, selection)));
}

describe('SeriesChartModal', () => {
  it('should open in annual mode on the most recent year and draw the months of the year', async () => {
    const loadSeries = closingSeriesLoader();

    renderModal(realAvailability, loadSeries);

    expect(screen.getByRole('dialog', { name: 'USD — Dólar dos Estados Unidos' })).toBeInTheDocument();
    expect(await screen.findByRole('img', { name: 'Gráfico de USD — Dólar dos Estados Unidos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anual', pressed: true })).toBeInTheDocument();
    expect(loadSeries).toHaveBeenCalledWith({ granularity: 'year', year: 2026 });
    expect(createdCharts.at(-1)?.config.data.labels).toEqual(['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']);
  });

  it('should draw the days of the most recent month with its variation when the user switches to monthly', async () => {
    const loadSeries = closingSeriesLoader();
    renderModal(realAvailability, loadSeries);
    await screen.findByRole('img', { name: 'Gráfico de USD — Dólar dos Estados Unidos' });

    fireEvent.click(screen.getByRole('button', { name: 'Mensal' }));

    expect(await screen.findByText('Variação no período: +0,38%')).toBeInTheDocument();
    expect(loadSeries).toHaveBeenLastCalledWith({ granularity: 'month', year: 2026, month: 9 });
    expect(createdCharts.at(-1)?.config.data.labels).toHaveLength(30);
  });

  it('should tell the user and skip the chart when the currency has no periods with data', async () => {
    const loadSeries = closingSeriesLoader();

    renderModal(() => Promise.resolve([]), loadSeries);

    expect(await screen.findByText('Sem cotações disponíveis.')).toBeInTheDocument();
    expect(loadSeries).not.toHaveBeenCalled();
  });

  it('should tell the user when the selected period has no closing quotes', async () => {
    renderModal(realAvailability, (selection) => Promise.resolve(toClosingSeries([], selection)));

    expect(await screen.findByText('Sem cotações neste período.')).toBeInTheDocument();
    expect(createdCharts).toHaveLength(0);
  });

  it('should show an error alert when the available periods cannot be loaded', async () => {
    renderModal(() => Promise.reject(new Error('GET /api/currencies/USD/periods responded with HTTP 500')), jest.fn());

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar o gráfico.');
  });

  it('should show an error alert when the series cannot be loaded', async () => {
    renderModal(realAvailability, () => Promise.reject(new Error('GET /api/currencies/USD/quotes responded with HTTP 500')));

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar o gráfico.');
  });
});
