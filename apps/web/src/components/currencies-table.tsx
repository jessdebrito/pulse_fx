import ShowChartIcon from '@mui/icons-material/ShowChart';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import type { JSX } from 'react';
import type { CurrencySummary } from '../api/currencies';
import { bulletinLabel, formatQuoteTime, formatQuoteValue } from '../lib/format';
import { CURRENCY_VARIATION_FORMAT } from '../lib/variation';
import { FavoriteButton } from './favorite-button';
import { VariationCell } from './variation-cell';

export interface CurrenciesTableProps {
  readonly currencies: readonly CurrencySummary[];
  readonly onShowChart: (currency: CurrencySummary) => void;
  readonly isFavorite: (currency: CurrencySummary) => boolean;
  readonly onToggleFavorite: (currency: CurrencySummary) => void;
}

const EMPTY_CELL = '—';
const NAME_CELL_SPACING = 1;
const NAME_CELL_STYLE = { alignItems: 'center' } as const;

export function CurrenciesTable({ currencies, onShowChart, isFavorite, onToggleFavorite }: CurrenciesTableProps): JSX.Element {
  return (
    <TableContainer component={Paper}>
      <Table aria-label="Cotações PTAX por moeda" size="small">
        <TableHead>
          <TableRow>
            <TableCell>Moeda</TableCell>
            <TableCell>Nome</TableCell>
            <TableCell>Boletim</TableCell>
            <TableCell>Horário</TableCell>
            <TableCell align="right">Compra (R$)</TableCell>
            <TableCell align="right">Venda (R$)</TableCell>
            <TableCell align="right">Variação</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {currencies.map((currency) => (
            <CurrencyRow
              key={currency.code}
              currency={currency}
              onShowChart={onShowChart}
              favorite={isFavorite(currency)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

interface CurrencyRowProps {
  readonly currency: CurrencySummary;
  readonly onShowChart: (currency: CurrencySummary) => void;
  readonly favorite: boolean;
  readonly onToggleFavorite: (currency: CurrencySummary) => void;
}

function CurrencyRow({ currency, onShowChart, favorite, onToggleFavorite }: CurrencyRowProps): JSX.Element {
  const quote = currency.latestQuote;
  return (
    <TableRow>
      <TableCell component="th" scope="row">
        {currency.code}
      </TableCell>
      <TableCell>
        <Stack direction="row" spacing={NAME_CELL_SPACING} sx={NAME_CELL_STYLE}>
          <span>{currency.name}</span>
          <FavoriteButton name={currency.code} active={favorite} onToggle={() => onToggleFavorite(currency)} />
          <IconButton
            size="small"
            aria-label={`Ver gráfico de ${currency.code}`}
            disabled={quote === null}
            onClick={() => onShowChart(currency)}
          >
            <ShowChartIcon fontSize="small" />
          </IconButton>
        </Stack>
      </TableCell>
      <TableCell>{quote === null ? EMPTY_CELL : bulletinLabel(quote.bulletin)}</TableCell>
      <TableCell>{quote === null ? EMPTY_CELL : formatQuoteTime(quote.quotedAt)}</TableCell>
      <TableCell align="right">{quote === null ? EMPTY_CELL : formatQuoteValue(quote.bid)}</TableCell>
      <TableCell align="right">{quote === null ? EMPTY_CELL : formatQuoteValue(quote.ask)}</TableCell>
      <VariationCell variation={currency.variation} format={CURRENCY_VARIATION_FORMAT} />
    </TableRow>
  );
}
