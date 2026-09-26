import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import { useId, type JSX, type ReactNode } from 'react';

export interface AppModalProps {
  readonly open: boolean;
  readonly title: string;
  readonly onClose: () => void;
  readonly children: ReactNode;
}

const TITLE_STYLE = { pr: 6 } as const;
const CLOSE_BUTTON_STYLE = { position: 'absolute', right: 8, top: 8 } as const;

export function AppModal({ open, title, onClose, children }: AppModalProps): JSX.Element {
  const titleId = useId();
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby={titleId} fullWidth maxWidth="md">
      <DialogTitle id={titleId} sx={TITLE_STYLE}>
        {title}
      </DialogTitle>
      <IconButton aria-label="Fechar" onClick={onClose} sx={CLOSE_BUTTON_STYLE}>
        <CloseIcon />
      </IconButton>
      <DialogContent dividers>{children}</DialogContent>
    </Dialog>
  );
}
