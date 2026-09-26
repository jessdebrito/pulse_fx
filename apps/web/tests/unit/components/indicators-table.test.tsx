import { fireEvent, render, screen, within } from '@testing-library/react';
import type { IndicatorSummary } from '../../../src/api/indicators';
import { IndicatorsTable } from '../../../src/components/indicators-table';
import { recordedIndicator } from '../../support/api/recorded-indicators';

const US_IMPORTS = recordedIndicator('fred', 'IMP3510');
const CUSTOMS_DUTIES = recordedIndicator('fred', 'B235RC1Q027SBEA');
const COMMODITIES_INDEX = recordedIndicator('sgs', '27574');

function renderTable(indicators: readonly IndicatorSummary[], onShowChart = jest.fn()): void {
  render(<IndicatorsTable title="Comércio EUA" indicators={indicators} onShowChart={onShowChart} />);
}

function rowOf(chartButtonName: string): HTMLElement {
  const row = screen.getByRole('button', { name: chartButtonName }).closest('tr');
  if (row === null) throw new Error(`Row with the button ${chartButtonName} not found`);
  return row;
}

function cellsOf(chartButtonName: string): (string | null)[] {
  return within(rowOf(chartButtonName)).getAllByRole('cell').map((cell) => cell.textContent);
}

describe('IndicatorsTable', () => {
  it('should render an accessible table named by the theme with the column headers', () => {
    renderTable([US_IMPORTS]);

    const table = screen.getByRole('table', { name: 'Comércio EUA' });
    expect(within(table).getAllByRole('columnheader').map((header) => header.textContent)).toEqual([
      'Indicador',
      'Fonte',
      'Frequência',
      'Referência',
      'Último valor',
      'Unidade',
    ]);
  });

  it('should show the Portuguese name, the official name and the latest observation of each indicator', () => {
    renderTable([US_IMPORTS, CUSTOMS_DUTIES, COMMODITIES_INDEX]);

    const row = rowOf('Ver gráfico de Importações dos EUA vindas do Brasil');
    expect(within(row).getByRole('rowheader')).toHaveTextContent('Importações dos EUA vindas do Brasil');
    expect(within(row).getByText('U.S. Imports of Goods by Customs Basis from Brazil')).toBeInTheDocument();
    expect(cellsOf('Ver gráfico de Importações dos EUA vindas do Brasil')).toEqual(['FRED', 'Mensal', 'jul/2026', '3.387,52', 'Millions of Dollars']);
    expect(cellsOf('Ver gráfico de Tarifas de importação arrecadadas pelos EUA')).toEqual(['FRED', 'Trimestral', '2º tri/2026', '326,32', 'Billions of Dollars']);
    expect(cellsOf('Ver gráfico de Índice de Commodities Brasil (IC-Br)')).toEqual(['BCB SGS', 'Mensal', 'ago/2026', '456,24', 'Índice']);
  });

  it('should show only the official name when the indicator has no Portuguese name', () => {
    renderTable([{ ...US_IMPORTS, code: 'UNKNOWN' }]);

    expect(screen.getByRole('rowheader')).toHaveTextContent(/^U\.S\. Imports of Goods by Customs Basis from Brazil$/);
    expect(screen.getByRole('button', { name: 'Ver gráfico de U.S. Imports of Goods by Customs Basis from Brazil' })).toBeInTheDocument();
  });

  it('should show dashes and disable the chart button when the indicator has no observation yet', () => {
    renderTable([{ ...US_IMPORTS, latestObservation: null }]);

    expect(cellsOf('Ver gráfico de Importações dos EUA vindas do Brasil')).toEqual(['FRED', 'Mensal', '—', '—', 'Millions of Dollars']);
    expect(screen.getByRole('button', { name: 'Ver gráfico de Importações dos EUA vindas do Brasil' })).toBeDisabled();
  });

  it('should call onShowChart with the indicator when its chart button is clicked', () => {
    const onShowChart = jest.fn();
    renderTable([US_IMPORTS, CUSTOMS_DUTIES], onShowChart);

    fireEvent.click(screen.getByRole('button', { name: 'Ver gráfico de Tarifas de importação arrecadadas pelos EUA' }));

    expect(onShowChart).toHaveBeenCalledWith(CUSTOMS_DUTIES);
  });
});
