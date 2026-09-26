import { fireEvent, render, screen, within } from '@testing-library/react';
import { PeriodPicker } from '../../../src/components/period-picker';
import { recordedUsdPeriodsAcrossYears } from '../../support/api/recorded-currencies';

const available = recordedUsdPeriodsAcrossYears().periods;

function choose(comboboxName: string, optionName: string): void {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: comboboxName }));
  fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name: optionName }));
}

describe('PeriodPicker', () => {
  it('should show the annual toggle pressed and only the year list when the selection is annual', () => {
    render(<PeriodPicker available={available} value={{ granularity: 'year', year: 2026 }} onChange={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Anual', pressed: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mensal', pressed: false })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Ano' })).toHaveTextContent('2026');
    expect(screen.queryByRole('combobox', { name: 'Mês' })).not.toBeInTheDocument();
  });

  it('should show the year and month lists when the selection is monthly', () => {
    render(<PeriodPicker available={available} value={{ granularity: 'month', year: 2026, month: 9 }} onChange={jest.fn()} />);

    expect(screen.getByRole('combobox', { name: 'Ano' })).toHaveTextContent('2026');
    expect(screen.getByRole('combobox', { name: 'Mês' })).toHaveTextContent('Setembro');
  });

  it('should list only the years with data and only the months with data of the selected year', () => {
    render(<PeriodPicker available={available} value={{ granularity: 'month', year: 2026, month: 9 }} onChange={jest.fn()} />);

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Ano' }));
    expect(within(screen.getByRole('listbox')).getAllByRole('option').map((option) => option.textContent)).toEqual(['2026', '2025']);
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Mês' }));
    expect(within(screen.getByRole('listbox')).getAllByRole('option').map((option) => option.textContent)).toEqual(['Janeiro', 'Setembro']);
  });

  it('should switch to monthly with the most recent month of the year when the user clicks Mensal', () => {
    const onChange = jest.fn();
    render(<PeriodPicker available={available} value={{ granularity: 'year', year: 2026 }} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Mensal' }));

    expect(onChange).toHaveBeenCalledWith({ granularity: 'month', year: 2026, month: 9 });
  });

  it('should report the chosen year when the user picks another year', () => {
    const onChange = jest.fn();
    render(<PeriodPicker available={available} value={{ granularity: 'year', year: 2026 }} onChange={onChange} />);

    choose('Ano', '2025');

    expect(onChange).toHaveBeenCalledWith({ granularity: 'year', year: 2025 });
  });

  it('should report the chosen month when the user picks another month', () => {
    const onChange = jest.fn();
    render(<PeriodPicker available={available} value={{ granularity: 'month', year: 2026, month: 9 }} onChange={onChange} />);

    choose('Mês', 'Janeiro');

    expect(onChange).toHaveBeenCalledWith({ granularity: 'month', year: 2026, month: 1 });
  });
});
