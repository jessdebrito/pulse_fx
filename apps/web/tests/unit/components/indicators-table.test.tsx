import { createTheme } from '@mui/material/styles';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { IndicatorSummary } from '../../../src/api/indicators';
import { IndicatorsTable } from '../../../src/components/indicators-table';
import { recordedIndicator } from '../../support/api/recorded-indicators';

const US_IMPORTS = recordedIndicator('fred', 'IMP3510');
const CUSTOMS_DUTIES = recordedIndicator('fred', 'B235RC1Q027SBEA');
const COMMODITIES_INDEX = recordedIndicator('sgs', '27574');

function renderTable(indicators: readonly IndicatorSummary[], onShowChart = jest.fn(), onToggleFavorite = jest.fn()): void {
  render(
    <IndicatorsTable
      title="Comércio EUA"
      indicators={indicators}
      onShowChart={onShowChart}
      isFavorite={(indicator) => indicator.code === 'IMP3510'}
      onToggleFavorite={onToggleFavorite}
    />,
  );
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
      'Variação',
      'Unidade',
    ]);
  });

  it('should show the Portuguese name, the official name and the latest observation of each indicator', () => {
    renderTable([US_IMPORTS, CUSTOMS_DUTIES, COMMODITIES_INDEX]);

    const row = rowOf('Ver gráfico de Importações dos EUA vindas do Brasil');
    expect(within(row).getByRole('rowheader')).toHaveTextContent('Importações dos EUA vindas do Brasil');
    expect(within(row).getByText('U.S. Imports of Goods by Customs Basis from Brazil')).toBeInTheDocument();
    expect(cellsOf('Ver gráfico de Importações dos EUA vindas do Brasil')).toEqual(['FRED', 'Mensal', 'jul/2026', '3.387,52', '-16,04%vs 4.034,78 em jul/2025', 'Millions of Dollars']);
    expect(cellsOf('Ver gráfico de Tarifas de importação arrecadadas pelos EUA')).toEqual(['FRED', 'Trimestral', '2º tri/2026', '326,32', '+21,91%vs 267,68 em 2º tri/2025', 'Billions of Dollars']);
    expect(cellsOf('Ver gráfico de Índice de Commodities Brasil (IC-Br)')).toEqual(['BCB SGS', 'Mensal', 'ago/2026', '456,24', '+6,53%vs 428,28 em ago/2025', 'Índice']);
  });

  it('should show only the official name when the indicator has no Portuguese name', () => {
    renderTable([{ ...US_IMPORTS, code: 'UNKNOWN' }]);

    expect(screen.getByRole('rowheader')).toHaveTextContent(/^U\.S\. Imports of Goods by Customs Basis from Brazil$/);
    expect(screen.getByRole('button', { name: 'Ver gráfico de U.S. Imports of Goods by Customs Basis from Brazil' })).toBeInTheDocument();
  });

  it('should show dashes and disable the chart button when the indicator has no observation yet', () => {
    renderTable([{ ...US_IMPORTS, latestObservation: null, variation: null }]);

    expect(cellsOf('Ver gráfico de Importações dos EUA vindas do Brasil')).toEqual(['FRED', 'Mensal', '—', '—', '—', 'Millions of Dollars']);
    expect(screen.getByRole('button', { name: 'Ver gráfico de Importações dos EUA vindas do Brasil' })).toBeDisabled();
  });

  it('should call onShowChart with the indicator when its chart button is clicked', () => {
    const onShowChart = jest.fn();
    renderTable([US_IMPORTS, CUSTOMS_DUTIES], onShowChart);

    fireEvent.click(screen.getByRole('button', { name: 'Ver gráfico de Tarifas de importação arrecadadas pelos EUA' }));

    expect(onShowChart).toHaveBeenCalledWith(CUSTOMS_DUTIES);
  });

  it('should show a pressed star on favorite indicators and report the indicator whose star is clicked', () => {
    const onToggleFavorite = jest.fn();
    renderTable([US_IMPORTS, CUSTOMS_DUTIES], jest.fn(), onToggleFavorite);

    expect(screen.getByRole('button', { name: 'Remover Importações dos EUA vindas do Brasil dos favoritos', pressed: true })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar Tarifas de importação arrecadadas pelos EUA aos favoritos', pressed: false }));

    expect(onToggleFavorite).toHaveBeenCalledWith(CUSTOMS_DUTIES);
  });

  it('should color the percent of the variation by its sign', () => {
    renderTable([US_IMPORTS, CUSTOMS_DUTIES]);

    expect(screen.getByText('-16,04%')).toHaveStyle({ color: createTheme().palette.error.main });
    expect(screen.getByText('+21,91%')).toHaveStyle({ color: createTheme().palette.success.main });
  });
});
