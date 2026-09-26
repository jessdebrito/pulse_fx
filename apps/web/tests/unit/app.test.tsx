import { fireEvent, render, screen } from '@testing-library/react';
import { App } from '../../src/app';
import type { CurrencyPeriods, CurrencyQuotes } from '../../src/api/currencies';
import type { DateRange } from '../../src/lib/periods';
import { recordedCurrencySummaries, recordedUsdPeriods, recordedUsdQuotes } from '../support/api/recorded-currencies';
import { createdCharts } from '../support/mocks/chart-js';

describe('App', () => {
  it('should show a loading message and then the currencies table when the API answers', async () => {
    render(<App loadCurrencies={() => Promise.resolve(recordedCurrencySummaries())} />);

    expect(screen.getByText('Carregando cotações…')).toBeInTheDocument();
    expect(await screen.findByRole('table', { name: 'Cotações PTAX por moeda' })).toBeInTheDocument();
  });

  it('should show an error alert when the API fails', async () => {
    render(<App loadCurrencies={() => Promise.reject(new Error('GET /api/currencies responded with HTTP 500'))} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar as cotações');
  });

  it('should open the chart modal on the most recent year when the user clicks the chart button of a currency', async () => {
    const loadCurrencyQuotes = jest.fn<Promise<CurrencyQuotes>, [string, DateRange]>().mockResolvedValue(recordedUsdQuotes());
    const loadCurrencyPeriods = jest.fn<Promise<CurrencyPeriods>, [string]>().mockResolvedValue(recordedUsdPeriods());
    render(
      <App
        loadCurrencies={() => Promise.resolve(recordedCurrencySummaries())}
        loadCurrencyQuotes={loadCurrencyQuotes}
        loadCurrencyPeriods={loadCurrencyPeriods}
      />,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Ver gráfico de USD' }));

    expect(await screen.findByRole('dialog', { name: 'USD — Dólar dos Estados Unidos' })).toBeInTheDocument();
    expect(await screen.findByRole('img', { name: 'Gráfico de USD — Dólar dos Estados Unidos' })).toBeInTheDocument();
    expect(createdCharts.at(-1)?.config.data.labels).toHaveLength(12);
    expect(loadCurrencyPeriods).toHaveBeenCalledWith('USD');
    expect(loadCurrencyQuotes).toHaveBeenCalledWith('USD', { from: '2026-01-01', to: '2026-12-31' });
  });
});
