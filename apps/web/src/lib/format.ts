import type { Bulletin } from '../api/currencies';

const MIN_QUOTE_DECIMALS = 4;
const MAX_QUOTE_DECIMALS = 5;

const quoteValueFormat = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: MIN_QUOTE_DECIMALS,
  maximumFractionDigits: MAX_QUOTE_DECIMALS,
});

const PERCENT = 100;
const PERCENT_DECIMALS = 2;

const percentFormat = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  minimumFractionDigits: PERCENT_DECIMALS,
  maximumFractionDigits: PERCENT_DECIMALS,
  signDisplay: 'exceptZero',
});

const QUOTE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

const BULLETIN_LABELS: Readonly<Record<Bulletin, string>> = {
  opening: 'Abertura',
  intermediate: 'Intermediário',
  closing: 'Fechamento',
};

export function formatQuoteValue(value: number): string {
  return quoteValueFormat.format(value);
}

export function formatQuoteTime(quotedAt: string): string {
  const match = QUOTE_TIME_PATTERN.exec(quotedAt);
  if (match === null) return quotedAt;
  const [, year, month, day, hour, minute] = match;
  return `${day}/${month}/${year} ${hour}:${minute}`;
}

export function bulletinLabel(bulletin: Bulletin): string {
  return BULLETIN_LABELS[bulletin];
}

export function formatPercent(value: number): string {
  return percentFormat.format(value / PERCENT);
}
