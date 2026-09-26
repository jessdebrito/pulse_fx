import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useId, type JSX } from 'react';
import {
  monthLabel,
  monthsOf,
  selectMonth,
  selectYear,
  switchGranularity,
  yearsOf,
  type AvailablePeriod,
  type Granularity,
  type PeriodSelection,
} from '../lib/periods';

export interface PeriodPickerProps {
  readonly available: readonly AvailablePeriod[];
  readonly value: PeriodSelection;
  readonly onChange: (selection: PeriodSelection) => void;
}

interface SelectOption {
  readonly value: string;
  readonly label: string;
}

const PICKER_SPACING = 2;
const PICKER_STYLE = { alignItems: 'center', flexWrap: 'wrap' } as const;
const SELECT_STYLE = { minWidth: 140 } as const;

export function PeriodPicker({ available, value, onChange }: PeriodPickerProps): JSX.Element {
  const years = yearsOf(available).map((year) => ({ value: String(year), label: String(year) }));
  const months = monthsOf(available, value.year).map((month) => ({ value: String(month), label: monthLabel(month) }));
  return (
    <Stack direction="row" spacing={PICKER_SPACING} sx={PICKER_STYLE}>
      <ToggleButtonGroup
        exclusive
        size="small"
        aria-label="Agrupamento"
        value={value.granularity}
        onChange={(_event, granularity: Granularity | null) => {
          if (granularity !== null) onChange(switchGranularity(value, granularity, available));
        }}
      >
        <ToggleButton value="year">Anual</ToggleButton>
        <ToggleButton value="month">Mensal</ToggleButton>
      </ToggleButtonGroup>
      <LabeledSelect label="Ano" value={String(value.year)} options={years} onChange={(year) => onChange(selectYear(value, Number(year), available))} />
      {value.granularity === 'month' && (
        <LabeledSelect label="Mês" value={String(value.month)} options={months} onChange={(month) => onChange(selectMonth(value, Number(month)))} />
      )}
    </Stack>
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
