import { fireEvent, render, screen, within } from '@testing-library/react';
import { IndicatorGroups } from '../../../src/components/indicator-groups';
import { recordedIndicator, recordedIndicatorSummaries } from '../../support/api/recorded-indicators';

describe('IndicatorGroups', () => {
  it('should render one heading and one table per theme in the display order', () => {
    render(<IndicatorGroups layout="table" indicators={recordedIndicatorSummaries()} onShowChart={jest.fn()} isFavorite={() => false} onToggleFavorite={jest.fn()} />);

    expect(screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual(['Comércio EUA', 'Tarifas', 'Energia', 'Metais', 'Agro', 'Brasil']);
    expect(within(screen.getByRole('table', { name: 'Brasil' })).getAllByRole('row')).toHaveLength(8);
    expect(within(screen.getByRole('table', { name: 'Agro' })).getAllByRole('row')).toHaveLength(7);
  });

  it('should render one list of cards per theme under the same headings when the layout is cards', () => {
    render(<IndicatorGroups layout="cards" indicators={recordedIndicatorSummaries()} onShowChart={jest.fn()} isFavorite={() => false} onToggleFavorite={jest.fn()} />);

    expect(screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual(['Comércio EUA', 'Tarifas', 'Energia', 'Metais', 'Agro', 'Brasil']);
    expect(within(screen.getByRole('list', { name: 'Brasil' })).getAllByRole('listitem')).toHaveLength(7);
    expect(within(screen.getByRole('list', { name: 'Agro' })).getAllByRole('listitem')).toHaveLength(6);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('should pass the clicked indicator to onShowChart', () => {
    const onShowChart = jest.fn();
    render(<IndicatorGroups layout="table" indicators={recordedIndicatorSummaries()} onShowChart={onShowChart} isFavorite={() => false} onToggleFavorite={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ver gráfico de Café arábica' }));

    expect(onShowChart).toHaveBeenCalledWith(recordedIndicator('fred', 'PCOFFOTMUSDM'));
  });

  it('should tell the user when there are no indicators yet', () => {
    render(<IndicatorGroups layout="table" indicators={[]} onShowChart={jest.fn()} isFavorite={() => false} onToggleFavorite={jest.fn()} />);

    expect(screen.getByText('Nenhum indicador sincronizado ainda.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('should pass the indicator whose star is clicked to onToggleFavorite', () => {
    const onToggleFavorite = jest.fn();
    render(<IndicatorGroups layout="table" indicators={recordedIndicatorSummaries()} onShowChart={jest.fn()} isFavorite={() => false} onToggleFavorite={onToggleFavorite} />);

    fireEvent.click(screen.getByRole('button', { name: 'Adicionar Soja aos favoritos' }));

    expect(onToggleFavorite).toHaveBeenCalledWith(recordedIndicator('fred', 'PSOYBUSDM'));
  });
});
