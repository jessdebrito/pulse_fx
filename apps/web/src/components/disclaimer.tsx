import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { JSX } from 'react';

const FOOTER_STYLE = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  py: 1,
  px: 2,
  bgcolor: 'background.paper',
  borderTop: 1,
  borderColor: 'divider',
  zIndex: 'appBar',
} as const;

export function Disclaimer(): JSX.Element {
  return (
    <Box component="footer" sx={FOOTER_STYLE}>
      <Typography variant="body2" align="center">
        Informação educacional. Não constitui recomendação de investimento.
      </Typography>
      <Typography variant="caption" component="p" align="center" color="text.secondary">
        Fontes: Banco Central do Brasil (PTAX e SGS) e FRED, Federal Reserve Bank of St. Louis. Os dados podem ter atraso em relação à publicação
        oficial.
      </Typography>
    </Box>
  );
}
