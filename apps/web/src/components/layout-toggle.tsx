import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import type { JSX } from 'react';

export type DashboardLayout = 'cards' | 'table';

export interface LayoutToggleProps {
  readonly value: DashboardLayout;
  readonly onChange: (layout: DashboardLayout) => void;
}

const LAYOUTS: readonly DashboardLayout[] = Object.freeze(['cards', 'table']);

const LAYOUT_LABELS: Readonly<Record<DashboardLayout, string>> = {
  cards: 'Cards',
  table: 'Tabela',
};

export function LayoutToggle({ value, onChange }: LayoutToggleProps): JSX.Element {
  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      aria-label="Visualização"
      value={value}
      onChange={(_event, layout: DashboardLayout | null) => {
        if (layout !== null) onChange(layout);
      }}
    >
      {LAYOUTS.map((layout) => (
        <ToggleButton key={layout} value={layout}>
          {LAYOUT_LABELS[layout]}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
