import { fireEvent, render, screen, within } from '@testing-library/react';
import { CurrenciesTable } from '../../../src/components/currencies-table';
import { recordedCurrency, recordedCurrencySummaries } from '../../support/api/recorded-currencies';

function cellsOfRow(code: string): (string | null)[] {
  const row = screen.getByRole('rowheader', { name: code }).closest('tr');
  if (row === null) throw new Error(`Row for ${code} not found`);
  return [...within(row).getAllByRole('rowheader'), ...within(row).getAllByRole('cell')].map((cell) => cell.textContent);
}

describe('CurrenciesTable', () => {
  it('should render an accessible table with the column headers when given currencies', () => {
    render(<CurrenciesTable currencies={recordedCurrencySummaries()} onShowChart={jest.fn()} />);

    const table = screen.getByRole('table', { name: 'Cotações PTAX por moeda' });
    expect(within(table).getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Moeda',
      'Nome',
      'Boletim',
      'Horário',
      'Compra (R$)',
      'Venda (R$)',
    ]);
  });

  it('should render one row per currency with the latest quote formatted when quotes exist', () => {
    render(<CurrenciesTable currencies={recordedCurrencySummaries()} onShowChart={jest.fn()} />);

    expect(screen.getAllByRole('row')).toHaveLength(11);
    expect(cellsOfRow('USD')).toEqual(['USD', 'Dólar dos Estados Unidos', 'Fechamento', '25/09/2026 13:10', '5,1985', '5,1991']);
    expect(cellsOfRow('JPY')).toEqual(['JPY', 'Iene', 'Fechamento', '25/09/2026 13:10', '0,03308', '0,03308']);
  });

  it('should show dashes in the quote columns when a currency has no quote yet', () => {
    render(<CurrenciesTable currencies={[{ ...recordedCurrency('USD'), latestQuote: null }]} onShowChart={jest.fn()} />);

    expect(cellsOfRow('USD')).toEqual(['USD', 'Dólar dos Estados Unidos', '—', '—', '—', '—']);
  });

  it('should render only the header row when there are no currencies', () => {
    render(<CurrenciesTable currencies={[]} onShowChart={jest.fn()} />);

    expect(screen.getAllByRole('row')).toHaveLength(1);
  });

  it('should call onShowChart with the currency when its chart button is clicked', () => {
    const onShowChart = jest.fn();
    render(<CurrenciesTable currencies={recordedCurrencySummaries()} onShowChart={onShowChart} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ver gráfico de USD' }));

    expect(onShowChart).toHaveBeenCalledWith(recordedCurrency('USD'));
  });

  it('should disable the chart button when the currency has no quote yet', () => {
    render(<CurrenciesTable currencies={[{ ...recordedCurrency('USD'), latestQuote: null }]} onShowChart={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Ver gráfico de USD' })).toBeDisabled();
  });
});
