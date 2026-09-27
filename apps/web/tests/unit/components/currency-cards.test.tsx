import { createTheme } from '@mui/material/styles';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { CurrencySummary } from '../../../src/api/currencies';
import { CurrencyCards } from '../../../src/components/currency-cards';
import { recordedCurrency, recordedCurrencySummaries } from '../../support/api/recorded-currencies';

function renderCards(currencies: readonly CurrencySummary[], onShowChart = jest.fn(), onToggleFavorite = jest.fn()): void {
  render(<CurrencyCards currencies={currencies} onShowChart={onShowChart} isFavorite={(currency) => currency.code === 'USD'} onToggleFavorite={onToggleFavorite} />);
}

function cardOf(code: string): HTMLElement {
  const card = screen.getByRole('heading', { level: 3, name: code }).closest('li');
  if (card === null) throw new Error(`Card of ${code} not found`);
  return card;
}

describe('CurrencyCards', () => {
  it('should render a list named like the table with one card per currency', () => {
    renderCards(recordedCurrencySummaries());

    const list = screen.getByRole('list', { name: 'Cotações PTAX por moeda' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(10);
    expect(within(list).getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual([
      'AUD',
      'CAD',
      'CHF',
      'DKK',
      'EUR',
      'GBP',
      'JPY',
      'NOK',
      'SEK',
      'USD',
    ]);
  });

  it('should show the name, the latest ask, the bid, the bulletin with its time and the variation with its base', () => {
    renderCards(recordedCurrencySummaries());

    const card = within(cardOf('USD'));
    expect(card.getByText('Dólar dos Estados Unidos')).toBeInTheDocument();
    expect(card.getByText('5,1991')).toBeInTheDocument();
    expect(card.getByText('Venda (R$) · Compra 5,1985')).toBeInTheDocument();
    expect(card.getByText('Fechamento · 25/09/2026 13:10')).toBeInTheDocument();
    expect(card.getByText('+0,81%').parentElement).toHaveTextContent(/^\+0,81% em 5 dias úteis$/);
    expect(card.getByText('vs 5,1575 em 18/09/2026')).toBeInTheDocument();
  });

  it('should say there is no quote yet and disable the chart when a currency has no quote', () => {
    renderCards([{ ...recordedCurrency('USD'), latestQuote: null, variation: null }]);

    const card = within(cardOf('USD'));
    expect(card.getByText('Sem cotação ainda.')).toBeInTheDocument();
    expect(card.getByText('Sem base de comparação')).toBeInTheDocument();
    expect(card.getByRole('button', { name: 'Ver gráfico de USD' })).toBeDisabled();
  });

  it('should call onShowChart with the currency when its chart button is clicked', () => {
    const onShowChart = jest.fn();
    renderCards(recordedCurrencySummaries(), onShowChart);

    fireEvent.click(screen.getByRole('button', { name: 'Ver gráfico de USD' }));

    expect(onShowChart).toHaveBeenCalledWith(recordedCurrency('USD'));
  });

  it('should show a pressed star on favorite currencies and report the currency whose star is clicked', () => {
    const onToggleFavorite = jest.fn();
    renderCards(recordedCurrencySummaries(), jest.fn(), onToggleFavorite);

    expect(within(cardOf('USD')).getByRole('button', { name: 'Remover USD dos favoritos', pressed: true })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar EUR aos favoritos', pressed: false }));

    expect(onToggleFavorite).toHaveBeenCalledWith(recordedCurrency('EUR'));
  });

  it('should draw the recent trend of the currency with its first and last closing as the description', () => {
    renderCards(recordedCurrencySummaries());

    expect(within(cardOf('USD')).getByRole('img', { name: 'Evolução: de 5,1717 em 29/06/2026 a 5,1991 em 25/09/2026' })).toBeInTheDocument();
  });

  it('should draw no trend when the currency has no recent closings', () => {
    renderCards([{ ...recordedCurrency('USD'), trend: [] }]);

    expect(within(cardOf('USD')).queryByRole('img')).not.toBeInTheDocument();
  });

  it('should color the percent of the variation by its sign', () => {
    renderCards(recordedCurrencySummaries());

    expect(within(cardOf('USD')).getByText('+0,81%')).toHaveStyle({ color: createTheme().palette.success.main });
    expect(within(cardOf('AUD')).getByText('-0,30%')).toHaveStyle({ color: createTheme().palette.error.main });
  });
});
