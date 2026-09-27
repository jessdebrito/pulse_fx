import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import IconButton from '@mui/material/IconButton';
import type { JSX } from 'react';

export interface FavoriteButtonProps {
  readonly name: string;
  readonly active: boolean;
  readonly onToggle: () => void;
}

export function FavoriteButton({ name, active, onToggle }: FavoriteButtonProps): JSX.Element {
  return (
    <IconButton size="small" aria-label={active ? `Remover ${name} dos favoritos` : `Adicionar ${name} aos favoritos`} aria-pressed={active} onClick={onToggle}>
      {active ? <StarIcon fontSize="small" color="warning" /> : <StarBorderIcon fontSize="small" />}
    </IconButton>
  );
}
