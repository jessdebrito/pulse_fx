import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useId, type JSX } from 'react';
import {
  CALENDAR_GRANULARITIES,
  monthLabel,
  monthsOf,
  selectMonth,
  selectYear,
  switchGranularity,
  windowLabel,
  yearsOf,
  type AvailablePeriod,
  type Granularity,
  type PeriodSelection,
  type WindowSelection,
} from '../lib/periods';

export interface PeriodPickerProps {
  readonly available: readonly AvailablePeriod[];
  readonly value: PeriodSelection;
  readonly onChange: (selection: PeriodSelection) => void;
  readonly granularities?: readonly Granularity[];
  readonly defaultWindow?: WindowSelection | null;
}

interface SelectOption {
  readonly value: string;
  readonly label: string;
}

const PICKER_SPACING = 2;
const PICKER_STYLE = { alignItems: 'center', flexWrap: 'wrap' } as const;
const SELECT_STYLE = { minWidth: 140 } as const;

const GRANULARITY_LABELS: Readonly<Record<Granularity, string>> = {
  year: 'Anual',
  month: 'Mensal',
  history: 'Histórico',
};

export function PeriodPicker({ available, value, onChange, granularities = CALENDAR_GRANULARITIES, defaultWindow = null }: PeriodPickerProps): JSX.Element {
  return (
    <Stack direction="row" spacing={PICKER_SPACING} sx={PICKER_STYLE}>
      <ToggleButtonGroup
        exclusive
        size="small"
        aria-label="Agrupamento"
        value={value.granularity}
        onChange={(_event, choice: PeriodSelection['granularity'] | null) => {
          if (choice === 'window') onChange(defaultWindow ?? value);
          else if (choice !== null) onChange(switchGranularity(value, choice, available));
        }}
      >
        {defaultWindow !== null && <ToggleButton value="window">{windowLabel(defaultWindow.window)}</ToggleButton>}
        {granularities.map((granularity) => (
          <ToggleButton key={granularity} value={granularity}>
            {GRANULARITY_LABELS[granularity]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      {(value.granularity === 'year' || value.granularity === 'month') && <CalendarSelects available={available} value={value} onChange={onChange} />}
    </Stack>
  );
}

interface CalendarSelectsProps {
  readonly available: readonly AvailablePeriod[];
  readonly value: Extract<PeriodSelection, { readonly granularity: 'year' | 'month' }>;
  readonly onChange: (selection: PeriodSelection) => void;
}

function CalendarSelects({ available, value, onChange }: CalendarSelectsProps): JSX.Element {
  const years = yearsOf(available).map((year) => ({ value: String(year), label: String(year) }));
  const months = monthsOf(available, value.year).map((month) => ({ value: String(month), label: monthLabel(month) }));
  return (
    <>
      <LabeledSelect label="Ano" value={String(value.year)} options={years} onChange={(year) => onChange(selectYear(value, Number(year), available))} />
      {value.granularity === 'month' && (
        <LabeledSelect label="Mês" value={String(value.month)} options={months} onChange={(month) => onChange(selectMonth(value, Number(month)))} />
      )}
    </>
  );
}

interface LabeledSelectProps {
  readonly label: string;
  readonly value: string;
  readonly options: readonly SelectOption[];
  readonly onChange: (value: string) => void;
}

function LabeledSelect({ label, value, options, onChange }: LabeledSelectProps): JSX.Element {
  const labelId = useId();
  return (
    <FormControl size="small" sx={SELECT_STYLE}>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select labelId={labelId} label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
