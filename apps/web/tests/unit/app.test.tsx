import { fireEvent, render, screen } from '@testing-library/react';
import { App, type AppProps } from '../../src/app';
import type { CurrencyPeriods, CurrencyQuotes } from '../../src/api/currencies';
import type { IndicatorKey, IndicatorObservations, IndicatorPeriods } from '../../src/api/indicators';
import type { DateRange } from '../../src/lib/periods';
import { recordedCurrencySummaries, recordedUsdPeriods, recordedUsdQuotes } from '../support/api/recorded-currencies';
import { recordedIndicatorSummaries, recordedUsImportsFromBrazilObservations, recordedUsImportsFromBrazilPeriods } from '../support/api/recorded-indicators';
import { createdCharts } from '../support/mocks/chart-js';

function renderApp(props: AppProps = {}): void {
  render(
    <App
      loadCurrencies={() => Promise.resolve(recordedCurrencySummaries())}
      loadIndicators={() => Promise.resolve(recordedIndicatorSummaries())}
      {...props}
    />,
  );
}

describe('App', () => {
  it('should show a loading message and then the currencies table when the API answers', async () => {
    renderApp();

    expect(screen.getByText('Carregando cotações…')).toBeInTheDocument();
    expect(await screen.findByRole('table', { name: 'Cotações PTAX por moeda' })).toBeInTheDocument();
  });

  it('should show an error alert when the API fails', async () => {
    renderApp({ loadCurrencies: () => Promise.reject(new Error('GET /api/currencies responded with HTTP 500')) });

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar as cotações');
  });

  it('should open the chart modal on the most recent year when the user clicks the chart button of a currency', async () => {
    const loadCurrencyQuotes = jest.fn<Promise<CurrencyQuotes>, [string, DateRange]>().mockResolvedValue(recordedUsdQuotes());
    const loadCurrencyPeriods = jest.fn<Promise<CurrencyPeriods>, [string]>().mockResolvedValue(recordedUsdPeriods());
    renderApp({ loadCurrencyQuotes, loadCurrencyPeriods });

    fireEvent.click(await screen.findByRole('button', { name: 'Ver gráfico de USD' }));

    expect(await screen.findByRole('dialog', { name: 'USD — Dólar dos Estados Unidos' })).toBeInTheDocument();
    expect(await screen.findByRole('img', { name: 'Gráfico de USD — Dólar dos Estados Unidos' })).toBeInTheDocument();
    expect(createdCharts.at(-1)?.config.data.labels).toHaveLength(12);
    expect(loadCurrencyPeriods).toHaveBeenCalledWith('USD');
    expect(loadCurrencyQuotes).toHaveBeenCalledWith('USD', { from: '2026-01-01', to: '2026-12-31' });
  });

  it('should show the exchange rates and the indicators grouped by theme under their own headings', async () => {
    renderApp();

    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual(['Câmbio (PTAX)', 'Indicadores']);
    expect(screen.getByText('Carregando indicadores…')).toBeInTheDocument();
    expect(await screen.findByRole('table', { name: 'Comércio EUA' })).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Brasil' })).toBeInTheDocument();
  });

  it('should keep the currencies and show an error alert for the indicators when only the indicators API fails', async () => {
    renderApp({ loadIndicators: () => Promise.reject(new Error('GET /api/indicators responded with HTTP 500')) });

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar os indicadores.');
    expect(await screen.findByRole('table', { name: 'Cotações PTAX por moeda' })).toBeInTheDocument();
  });

  it('should open the indicator chart on the most recent year and load the full history when the user picks Histórico', async () => {
    const loadIndicatorObservations = jest.fn<Promise<IndicatorObservations>, [IndicatorKey, DateRange]>().mockResolvedValue(recordedUsImportsFromBrazilObservations());
    const loadIndicatorPeriods = jest.fn<Promise<IndicatorPeriods>, [IndicatorKey]>().mockResolvedValue(recordedUsImportsFromBrazilPeriods());
    renderApp({ loadIndicatorObservations, loadIndicatorPeriods });

    fireEvent.click(await screen.findByRole('button', { name: 'Ver gráfico de Importações dos EUA vindas do Brasil' }));

    expect(await screen.findByRole('dialog', { name: 'Importações dos EUA vindas do Brasil' })).toBeInTheDocument();
    expect(await screen.findByRole('img', { name: 'Gráfico de Importações dos EUA vindas do Brasil' })).toBeInTheDocument();
    expect(loadIndicatorPeriods).toHaveBeenCalledWith({ source: 'fred', code: 'IMP3510' });
    expect(loadIndicatorObservations).toHaveBeenCalledWith({ source: 'fred', code: 'IMP3510' }, { from: '2026-01-01', to: '2026-12-31' });
    expect(screen.queryByRole('button', { name: 'Mensal' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Histórico' }));

    expect(await screen.findByText('Variação no período: -9,88%')).toBeInTheDocument();
    expect(loadIndicatorObservations).toHaveBeenLastCalledWith({ source: 'fred', code: 'IMP3510' }, { from: '2024-01-01', to: '2026-07-31' });
  });
});
