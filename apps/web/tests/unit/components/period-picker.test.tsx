import { fireEvent, render, screen, within } from '@testing-library/react';
import { PeriodPicker } from '../../../src/components/period-picker';
import { recordedUsdPeriodsAcrossYears } from '../../support/api/recorded-currencies';
import { recordedUsImportsFromBrazilPeriods } from '../../support/api/recorded-indicators';

const available = recordedUsdPeriodsAcrossYears().periods;
const indicatorPeriods = recordedUsImportsFromBrazilPeriods().periods;
const INDICATOR_GRANULARITIES = ['year', 'history'] as const;
const USD_WINDOW = { granularity: 'window', window: { unit: 'day', length: 90 }, from: '2026-06-28', to: '2026-09-25' } as const;
const US_IMPORTS_WINDOW = { granularity: 'window', window: { unit: 'month', length: 24 }, from: '2024-08-01', to: '2026-07-31' } as const;

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

  it('should offer Anual and Histórico without Mensal when those are the granularities', () => {
    render(<PeriodPicker available={indicatorPeriods} value={{ granularity: 'year', year: 2026 }} onChange={jest.fn()} granularities={INDICATOR_GRANULARITIES} />);

    expect(screen.getByRole('button', { name: 'Anual', pressed: true })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Histórico', pressed: false })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mensal' })).not.toBeInTheDocument();
  });

  it('should switch to the full history of the data when the user clicks Histórico', () => {
    const onChange = jest.fn();
    render(<PeriodPicker available={indicatorPeriods} value={{ granularity: 'year', year: 2026 }} onChange={onChange} granularities={INDICATOR_GRANULARITIES} />);

    fireEvent.click(screen.getByRole('button', { name: 'Histórico' }));

    expect(onChange).toHaveBeenCalledWith({ granularity: 'history', from: '2024-01', to: '2026-07' });
  });

  it('should hide the year list when the selection is the full history', () => {
    render(<PeriodPicker available={indicatorPeriods} value={{ granularity: 'history', from: '2024-01', to: '2026-07' }} onChange={jest.fn()} granularities={INDICATOR_GRANULARITIES} />);

    expect(screen.getByRole('button', { name: 'Histórico', pressed: true })).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Ano' })).not.toBeInTheDocument();
  });

  it('should put the default window first, named by its length, pressed and without the year list when it is the selection', () => {
    render(<PeriodPicker available={available} value={USD_WINDOW} onChange={jest.fn()} defaultWindow={USD_WINDOW} />);

    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual(['90 dias', 'Anual', 'Mensal']);
    expect(screen.getByRole('button', { name: '90 dias', pressed: true })).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Ano' })).not.toBeInTheDocument();
  });

  it('should go back to the default window when the user clicks it', () => {
    const onChange = jest.fn();
    render(
      <PeriodPicker available={indicatorPeriods} value={{ granularity: 'year', year: 2025 }} onChange={onChange} granularities={INDICATOR_GRANULARITIES} defaultWindow={US_IMPORTS_WINDOW} />,
    );

    fireEvent.click(screen.getByRole('button', { name: '24 meses' }));

    expect(onChange).toHaveBeenCalledWith(US_IMPORTS_WINDOW);
  });

  it('should switch from the default window to the year where it ends when the user clicks Anual', () => {
    const onChange = jest.fn();
    render(<PeriodPicker available={available} value={USD_WINDOW} onChange={onChange} defaultWindow={USD_WINDOW} />);

    fireEvent.click(screen.getByRole('button', { name: 'Anual' }));

    expect(onChange).toHaveBeenCalledWith({ granularity: 'year', year: 2026 });
  });

  it('should offer no window toggle when there is no default window', () => {
    render(<PeriodPicker available={available} value={{ granularity: 'year', year: 2026 }} onChange={jest.fn()} defaultWindow={null} />);

    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual(['Anual', 'Mensal']);
  });
});
