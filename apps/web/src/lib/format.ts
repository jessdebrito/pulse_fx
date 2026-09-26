import type { Bulletin } from '../api/currencies';
import type { IndicatorFrequency, IndicatorSource } from '../api/indicators';

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

const INDICATOR_DECIMALS = 2;
const MONTHS_IN_QUARTER = 3;

const indicatorValueFormat = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: INDICATOR_DECIMALS,
  maximumFractionDigits: INDICATOR_DECIMALS,
});

const monthAbbreviationFormat = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' });

const FREQUENCY_LABELS: Readonly<Record<IndicatorFrequency, string>> = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  annual: 'Anual',
};

const SOURCE_LABELS: Readonly<Record<IndicatorSource, string>> = {
  fred: 'FRED',
  sgs: 'BCB SGS',
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

export function formatIndicatorValue(value: number): string {
  return indicatorValueFormat.format(value);
}

export function formatReferenceDate(date: string, frequency: IndicatorFrequency): string {
  const [year = '', month = '', day = ''] = date.split('-');
  if (frequency === 'monthly') return `${monthAbbreviationFormat.format(new Date(`${date}T00:00:00Z`)).replace('.', '')}/${year}`;
  if (frequency === 'quarterly') return `${Math.ceil(Number(month) / MONTHS_IN_QUARTER)}º tri/${year}`;
  if (frequency === 'annual') return year;
  return `${day}/${month}/${year}`;
}

export function frequencyLabel(frequency: IndicatorFrequency): string {
  return FREQUENCY_LABELS[frequency];
}

export function sourceLabel(source: IndicatorSource): string {
  return SOURCE_LABELS[source];
}
