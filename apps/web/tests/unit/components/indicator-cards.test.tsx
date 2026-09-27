import { fireEvent, render, screen, within } from '@testing-library/react';
import type { IndicatorSummary } from '../../../src/api/indicators';
import { IndicatorCards } from '../../../src/components/indicator-cards';
import { recordedIndicator } from '../../support/api/recorded-indicators';

const US_IMPORTS = recordedIndicator('fred', 'IMP3510');
const CUSTOMS_DUTIES = recordedIndicator('fred', 'B235RC1Q027SBEA');
const COMMODITIES_INDEX = recordedIndicator('sgs', '27574');

function renderCards(indicators: readonly IndicatorSummary[], onShowChart = jest.fn(), onToggleFavorite = jest.fn()): void {
  render(
    <IndicatorCards
      title="Comércio EUA"
      indicators={indicators}
      onShowChart={onShowChart}
      isFavorite={(indicator) => indicator.code === 'IMP3510'}
      onToggleFavorite={onToggleFavorite}
    />,
  );
}

function cardOf(name: string): HTMLElement {
  const card = screen.getByRole('heading', { level: 4, name }).closest('li');
  if (card === null) throw new Error(`Card of ${name} not found`);
  return card;
}

describe('IndicatorCards', () => {
  it('should render a list named by the theme with one card per indicator', () => {
    renderCards([US_IMPORTS, CUSTOMS_DUTIES, COMMODITIES_INDEX]);

    const list = screen.getByRole('list', { name: 'Comércio EUA' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
  });

  it('should show the Portuguese name, the official name, the latest value with its unit, the reference and the variation', () => {
    renderCards([US_IMPORTS]);

    const card = within(cardOf('Importações dos EUA vindas do Brasil'));
    expect(card.getByText('U.S. Imports of Goods by Customs Basis from Brazil')).toBeInTheDocument();
    expect(card.getByText('3.387,52')).toBeInTheDocument();
    expect(card.getByText('Millions of Dollars')).toBeInTheDocument();
    expect(card.getByText('jul/2026 · Mensal · FRED')).toBeInTheDocument();
    expect(card.getByText('-16,04% em 12 meses')).toBeInTheDocument();
    expect(card.getByText('vs 4.034,78 em jul/2025')).toBeInTheDocument();
  });

  it('should show the quarter as the reference of a quarterly series and the source of an SGS series', () => {
    renderCards([CUSTOMS_DUTIES, COMMODITIES_INDEX]);

    const duties = within(cardOf('Tarifas de importação arrecadadas pelos EUA'));
    expect(duties.getByText('2º tri/2026 · Trimestral · FRED')).toBeInTheDocument();
    expect(duties.getByText('+21,91% em 12 meses')).toBeInTheDocument();
    expect(duties.getByText('vs 267,68 em 2º tri/2025')).toBeInTheDocument();
    expect(within(cardOf('Índice de Commodities Brasil (IC-Br)')).getByText('ago/2026 · Mensal · BCB SGS')).toBeInTheDocument();
  });

  it('should use the official name as the title when the indicator has no Portuguese name', () => {
    renderCards([{ ...US_IMPORTS, code: 'UNKNOWN' }]);

    expect(screen.getByRole('heading', { level: 4, name: 'U.S. Imports of Goods by Customs Basis from Brazil' })).toBeInTheDocument();
    expect(screen.getAllByText('U.S. Imports of Goods by Customs Basis from Brazil')).toHaveLength(1);
  });

  it('should say there is no observation yet and disable the chart when the indicator has no data', () => {
    renderCards([{ ...US_IMPORTS, latestObservation: null, variation: null }]);

    const card = within(cardOf('Importações dos EUA vindas do Brasil'));
    expect(card.getByText('Sem observação ainda.')).toBeInTheDocument();
    expect(card.getByText('Sem base de comparação')).toBeInTheDocument();
    expect(card.getByRole('button', { name: 'Ver gráfico de Importações dos EUA vindas do Brasil' })).toBeDisabled();
  });

  it('should report the indicator whose chart button or star is clicked and press the star of favorites', () => {
    const onShowChart = jest.fn();
    const onToggleFavorite = jest.fn();
    renderCards([US_IMPORTS, CUSTOMS_DUTIES], onShowChart, onToggleFavorite);

    expect(screen.getByRole('button', { name: 'Remover Importações dos EUA vindas do Brasil dos favoritos', pressed: true })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Ver gráfico de Importações dos EUA vindas do Brasil' }));
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar Tarifas de importação arrecadadas pelos EUA aos favoritos' }));

    expect(onShowChart).toHaveBeenCalledWith(US_IMPORTS);
    expect(onToggleFavorite).toHaveBeenCalledWith(CUSTOMS_DUTIES);
  });

  it('should draw the recent trend of the indicator with its first and last observation as the description', () => {
    renderCards([US_IMPORTS]);

    expect(within(cardOf('Importações dos EUA vindas do Brasil')).getByRole('img', { name: 'Evolução: de 3.945,55 em ago/2024 a 3.387,52 em jul/2026' })).toBeInTheDocument();
  });

  it('should draw no trend when the indicator has no recent observations', () => {
    renderCards([{ ...US_IMPORTS, trend: [] }]);

    expect(within(cardOf('Importações dos EUA vindas do Brasil')).queryByRole('img')).not.toBeInTheDocument();
  });
});
