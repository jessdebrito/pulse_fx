import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { SeriesChartModal } from '../../../src/components/series-chart-modal';
import type { AvailablePeriod, PeriodSelection } from '../../../src/lib/periods';
import { toClosingSeries, toIndicatorSeries, type TimeSeries } from '../../../src/lib/series';
import { recordedUsdPeriods, recordedUsdQuotes } from '../../support/api/recorded-currencies';
import { recordedUsImportsFromBrazilObservations, recordedUsImportsFromBrazilPeriods } from '../../support/api/recorded-indicators';
import { createdCharts } from '../../support/mocks/chart-js';

function renderModal(loadAvailability: () => Promise<readonly AvailablePeriod[]>, loadSeries: (selection: PeriodSelection) => Promise<TimeSeries>): void {
  render(
    <SeriesChartModal
      open
      title="USD — Dólar dos Estados Unidos"
      onClose={jest.fn()}
      loadAvailability={loadAvailability}
      loadSeries={loadSeries}
      variationText={USD_VARIATION_TEXT}
      limitations={PTAX_LIMITATIONS}
    />,
  );
}

const PTAX_LIMITATIONS = ['A PTAX é publicada só em dias úteis.', 'O gráfico usa o fechamento PTAX (venda).'];

const USD_VARIATION_TEXT = 'Variação (5 dias úteis): +0,81% — de 5,1575 em 18/09/2026 para 5,1991 em 25/09/2026';

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

  it('should show the variation given by the caller above the chart instead of recomputing it for the selected period', async () => {
    renderModal(realAvailability, closingSeriesLoader());

    expect(await screen.findByText(USD_VARIATION_TEXT)).toBeInTheDocument();
    expect(screen.queryByText(/Variação no período/)).not.toBeInTheDocument();
  });

  it('should draw the days of the most recent month when the user switches to monthly', async () => {
    const loadSeries = closingSeriesLoader();
    renderModal(realAvailability, loadSeries);
    await screen.findByRole('img', { name: 'Gráfico de USD — Dólar dos Estados Unidos' });

    fireEvent.click(screen.getByRole('button', { name: 'Mensal' }));

    await waitFor(() => expect(createdCharts.at(-1)?.config.data.labels).toHaveLength(30));
    expect(loadSeries).toHaveBeenLastCalledWith({ granularity: 'month', year: 2026, month: 9 });
    expect(screen.getByText(USD_VARIATION_TEXT)).toBeInTheDocument();
  });

  it('should tell the user and skip the chart when the series has no periods with data', async () => {
    const loadSeries = closingSeriesLoader();

    renderModal(() => Promise.resolve([]), loadSeries);

    expect(await screen.findByText('Sem dados disponíveis.')).toBeInTheDocument();
    expect(loadSeries).not.toHaveBeenCalled();
  });

  it('should tell the user when the selected period has no data', async () => {
    renderModal(realAvailability, (selection) => Promise.resolve(toClosingSeries([], selection)));

    expect(await screen.findByText('Sem dados neste período.')).toBeInTheDocument();
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

  it('should load and draw the full history when the granularities include Histórico and the user picks it', async () => {
    const loadSeries = jest
      .fn<Promise<TimeSeries>, [PeriodSelection]>()
      .mockImplementation((selection) => Promise.resolve(toIndicatorSeries(recordedUsImportsFromBrazilObservations().observations, selection, 'Importações dos EUA vindas do Brasil')));
    render(
      <SeriesChartModal
        open
        title="Importações dos EUA vindas do Brasil"
        onClose={jest.fn()}
        loadAvailability={() => Promise.resolve(recordedUsImportsFromBrazilPeriods().periods)}
        loadSeries={loadSeries}
        granularities={['year', 'history']}
        variationText="Variação (12 meses): -16,04% — de 4.034,78 em jul/2025 para 3.387,52 em jul/2026"
        limitations={[]}
      />,
    );
    await screen.findByRole('img', { name: 'Gráfico de Importações dos EUA vindas do Brasil' });

    fireEvent.click(screen.getByRole('button', { name: 'Histórico' }));

    await waitFor(() => expect(createdCharts.at(-1)?.config.data.labels).toHaveLength(31));
    expect(loadSeries).toHaveBeenLastCalledWith({ granularity: 'history', from: '2024-01', to: '2026-07' });
  });

  it('should list the data limitations given by the caller under their own heading', async () => {
    renderModal(realAvailability, closingSeriesLoader());

    const list = await screen.findByRole('list', { name: 'Observações' });
    expect(within(list).getAllByRole('listitem').map((item) => item.textContent)).toEqual(PTAX_LIMITATIONS);
  });
});
