import { fireEvent, render, screen, within } from '@testing-library/react';
import { LayoutToggle } from '../../../src/components/layout-toggle';

describe('LayoutToggle', () => {
  it('should offer Cards and Tabela in a group named Visualização with the current layout pressed', () => {
    render(<LayoutToggle value="cards" onChange={jest.fn()} />);

    const group = screen.getByRole('group', { name: 'Visualização' });
    expect(within(group).getAllByRole('button').map((button) => button.textContent)).toEqual(['Cards', 'Tabela']);
    expect(screen.getByRole('button', { name: 'Cards', pressed: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tabela', pressed: false })).toBeInTheDocument();
  });

  it('should report the layout the user picks', () => {
    const onChange = jest.fn();
    render(<LayoutToggle value="cards" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Tabela' }));

    expect(onChange).toHaveBeenCalledWith('table');
  });

  it('should keep the layout when the user clicks the one already pressed', () => {
    const onChange = jest.fn();
    render(<LayoutToggle value="table" onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Tabela' }));

    expect(onChange).not.toHaveBeenCalled();
  });
});
