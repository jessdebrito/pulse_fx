import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { SeriesChartModal } from '../../../src/components/series-chart-modal';
import type { AvailablePeriod, PeriodSelection, WindowSelection } from '../../../src/lib/periods';
import { toClosingSeries, toIndicatorSeries, type TimeSeries } from '../../../src/lib/series';
import { recordedUsdPeriods, recordedUsdQuotes } from '../../support/api/recorded-currencies';
import { recordedUsImportsFromBrazilObservations, recordedUsImportsFromBrazilPeriods } from '../../support/api/recorded-indicators';
import { createdCharts } from '../../support/mocks/chart-js';

function renderModal(
  loadAvailability: () => Promise<readonly AvailablePeriod[]>,
  loadSeries: (selection: PeriodSelection) => Promise<TimeSeries>,
  defaultWindow: WindowSelection | null = null,
): void {
  render(
    <SeriesChartModal
      open
      title="USD — Dólar dos Estados Unidos"
      onClose={jest.fn()}
      loadAvailability={loadAvailability}
      loadSeries={loadSeries}
      defaultWindow={defaultWindow}
      variationText={USD_VARIATION_TEXT}
      reason={USD_REASON}
      limitations={PTAX_LIMITATIONS}
    />,
  );
}

const USD_REASON = 'A PTAX do dólar é a taxa de referência oficial do BCB.';

const PTAX_LIMITATIONS = ['A PTAX é publicada só em dias úteis.', 'O gráfico usa o fechamento PTAX (venda).'];

const USD_VARIATION_TEXT = 'Variação (5 dias úteis): +0,81% — de 5,1575 em 18/09/2026 para 5,1991 em 25/09/2026';

const USD_WINDOW: WindowSelection = { granularity: 'window', window: { unit: 'day', length: 90 }, from: '2026-06-28', to: '2026-09-25' };

const realAvailability = (): Promise<readonly AvailablePeriod[]> => Promise.resolve(recordedUsdPeriods().periods);

function closingSeriesLoader(): jest.Mock<Promise<TimeSeries>, [PeriodSelection]> {
  return jest.fn<Promise<TimeSeries>, [PeriodSelection]>().mockImplementation((selection) => Promise.resolve(toClosingSeries(recordedUsdQuotes().quotes, selection)));
}

describe('SeriesChartModal', () => {
  it('should open on the default window when the caller gives one and draw one point per day of the window', async () => {
    const loadSeries = closingSeriesLoader();

    renderModal(realAvailability, loadSeries, USD_WINDOW);

    expect(await screen.findByRole('img', { name: 'Gráfico de USD — Dólar dos Estados Unidos' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '90 dias', pressed: true })).toBeInTheDocument();
    expect(loadSeries).toHaveBeenCalledWith(USD_WINDOW);
    expect(createdCharts.at(-1)?.config.data.labels).toHaveLength(90);
  });

  it('should load the default window again when the user returns to it from another period', async () => {
    const loadSeries = closingSeriesLoader();
    renderModal(realAvailability, loadSeries, USD_WINDOW);
    await screen.findByRole('img', { name: 'Gráfico de USD — Dólar dos Estados Unidos' });

    fireEvent.click(screen.getByRole('button', { name: 'Anual' }));
    await waitFor(() => expect(loadSeries).toHaveBeenLastCalledWith({ granularity: 'year', year: 2026 }));
    fireEvent.click(screen.getByRole('button', { name: '90 dias' }));

    await waitFor(() => expect(loadSeries).toHaveBeenLastCalledWith(USD_WINDOW));
  });

  it('should open in annual mode on the most recent year and draw the months of the year when there is no default window', async () => {
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
        defaultWindow={null}
        variationText="Variação (12 meses): -16,04% — de 4.034,78 em jul/2025 para 3.387,52 em jul/2026"
        reason={null}
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

  it('should explain why the series is worth following under its own heading before the limitations', async () => {
    renderModal(realAvailability, closingSeriesLoader());

    const region = await screen.findByRole('region', { name: 'Por que acompanhar' });
    expect(within(region).getByText(USD_REASON)).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual(['Por que acompanhar', 'Observações']);
  });

  it('should leave out the reason section when the caller has no reason for the series', async () => {
    render(
      <SeriesChartModal
        open
        title="Série sem justificativa"
        onClose={jest.fn()}
        loadAvailability={realAvailability}
        loadSeries={closingSeriesLoader()}
        defaultWindow={null}
        variationText={USD_VARIATION_TEXT}
        reason={null}
        limitations={PTAX_LIMITATIONS}
      />,
    );

    await screen.findByRole('list', { name: 'Observações' });
    expect(screen.queryByRole('region', { name: 'Por que acompanhar' })).not.toBeInTheDocument();
  });
});
