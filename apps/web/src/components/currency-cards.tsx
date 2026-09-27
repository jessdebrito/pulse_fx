import type { JSX } from 'react';
import type { CurrencySummary, Quote } from '../api/currencies';
import { bulletinLabel, formatQuoteTime, formatQuoteValue } from '../lib/format';
import { CURRENCY_VARIATION_FORMAT } from '../lib/variation';
import type { CurrenciesTableProps } from './currencies-table';
import { CardGrid, SeriesActions, SummaryCard, SummaryNote, SummaryValue, SummaryVariation } from './summary-card';

export type CurrencyCardsProps = CurrenciesTableProps;

interface CurrencyCardProps {
  readonly currency: CurrencySummary;
  readonly favorite: boolean;
  readonly onShowChart: (currency: CurrencySummary) => void;
  readonly onToggleFavorite: (currency: CurrencySummary) => void;
}

export function CurrencyCards({ currencies, onShowChart, isFavorite, onToggleFavorite }: CurrencyCardsProps): JSX.Element {
  return (
    <CardGrid label="Cotações PTAX por moeda">
      {currencies.map((currency) => (
        <CurrencyCard key={currency.code} currency={currency} favorite={isFavorite(currency)} onShowChart={onShowChart} onToggleFavorite={onToggleFavorite} />
      ))}
    </CardGrid>
  );
}

function CurrencyCard({ currency, favorite, onShowChart, onToggleFavorite }: CurrencyCardProps): JSX.Element {
  const quote = currency.latestQuote;
  const actions = (
    <SeriesActions
      name={currency.code}
      favorite={favorite}
      chartDisabled={quote === null}
      onToggleFavorite={() => onToggleFavorite(currency)}
      onShowChart={() => onShowChart(currency)}
    />
  );
  return (
    <SummaryCard heading={{ title: currency.code, subtitle: currency.name, level: 'h3' }} actions={actions}>
      {quote === null ? <SummaryNote text="Sem cotação ainda." /> : <QuoteSummary quote={quote} />}
      <SummaryVariation variation={currency.variation} frequency="daily" format={CURRENCY_VARIATION_FORMAT} />
    </SummaryCard>
  );
}

function QuoteSummary({ quote }: { readonly quote: Quote }): JSX.Element {
  return (
    <>
      <SummaryValue value={formatQuoteValue(quote.ask)} caption={`Venda (R$) · Compra ${formatQuoteValue(quote.bid)}`} />
      <SummaryNote text={`${bulletinLabel(quote.bulletin)} · ${formatQuoteTime(quote.quotedAt)}`} />
    </>
  );
}
