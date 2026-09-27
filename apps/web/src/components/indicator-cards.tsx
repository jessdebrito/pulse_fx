import type { JSX } from 'react';
import type { IndicatorSummary, Observation } from '../api/indicators';
import { formatIndicatorValue, formatReferenceDate, frequencyLabel, sourceLabel } from '../lib/format';
import { indicatorLabel } from '../lib/indicators';
import { indicatorVariationFormat } from '../lib/variation';
import type { IndicatorsTableProps } from './indicators-table';
import { CardGrid, SeriesActions, SummaryCard, SummaryNote, SummaryTrend, SummaryValue, SummaryVariation } from './summary-card';

export type IndicatorCardsProps = IndicatorsTableProps;

interface IndicatorCardProps {
  readonly indicator: IndicatorSummary;
  readonly favorite: boolean;
  readonly onShowChart: (indicator: IndicatorSummary) => void;
  readonly onToggleFavorite: (indicator: IndicatorSummary) => void;
}

export function IndicatorCards({ title, indicators, onShowChart, isFavorite, onToggleFavorite }: IndicatorCardsProps): JSX.Element {
  return (
    <CardGrid label={title}>
      {indicators.map((indicator) => (
        <IndicatorCard
          key={`${indicator.source}/${indicator.code}`}
          indicator={indicator}
          favorite={isFavorite(indicator)}
          onShowChart={onShowChart}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </CardGrid>
  );
}

function IndicatorCard({ indicator, favorite, onShowChart, onToggleFavorite }: IndicatorCardProps): JSX.Element {
  const label = indicatorLabel(indicator);
  const displayName = label ?? indicator.name;
  const observation = indicator.latestObservation;
  const format = indicatorVariationFormat(indicator.frequency);
  const actions = (
    <SeriesActions
      name={displayName}
      favorite={favorite}
      chartDisabled={observation === null}
      onToggleFavorite={() => onToggleFavorite(indicator)}
      onShowChart={() => onShowChart(indicator)}
    />
  );
  return (
    <SummaryCard heading={{ title: displayName, subtitle: label === null ? null : indicator.name, level: 'h4' }} actions={actions}>
      {observation === null ? <SummaryNote text="Sem observação ainda." /> : <ObservationSummary indicator={indicator} observation={observation} />}
      <SummaryTrend trend={indicator.trend} format={format} />
      <SummaryVariation variation={indicator.variation} frequency={indicator.frequency} format={format} />
    </SummaryCard>
  );
}

function ObservationSummary({ indicator, observation }: { readonly indicator: IndicatorSummary; readonly observation: Observation }): JSX.Element {
  const reference = [formatReferenceDate(observation.date, indicator.frequency), frequencyLabel(indicator.frequency), sourceLabel(indicator.source)].join(' · ');
  return (
    <>
      <SummaryValue value={formatIndicatorValue(observation.value)} caption={indicator.unit} />
      <SummaryNote text={reference} />
    </>
  );
}
