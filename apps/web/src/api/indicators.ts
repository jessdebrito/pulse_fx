import { z } from 'zod';
import type { DateRange } from '../lib/periods';
import { browserFetch, getJson, type FetchFunction } from './http';
import { availablePeriodsSchema } from './schemas';

const sourceSchema = z.enum(['fred', 'sgs']);

const frequencySchema = z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'annual']);

const observationSchema = z.object({
  date: z.iso.date(),
  value: z.number(),
});

const indicatorFields = {
  source: sourceSchema,
  code: z.string().min(1),
  name: z.string().min(1),
  unit: z.string().min(1),
  frequency: frequencySchema,
};

export const indicatorSummarySchema = z.object({ ...indicatorFields, latestObservation: observationSchema.nullable() });

export const indicatorObservationsSchema = z.object({ ...indicatorFields, from: z.string(), to: z.string(), observations: z.array(observationSchema) });

export const indicatorPeriodsSchema = z.object({ source: sourceSchema, code: z.string().min(1), periods: availablePeriodsSchema });

export type IndicatorSource = z.infer<typeof sourceSchema>;

export type IndicatorFrequency = z.infer<typeof frequencySchema>;

export type Observation = z.infer<typeof observationSchema>;

export type IndicatorSummary = z.infer<typeof indicatorSummarySchema>;

export type IndicatorObservations = z.infer<typeof indicatorObservationsSchema>;

export type IndicatorPeriods = z.infer<typeof indicatorPeriodsSchema>;

export interface IndicatorKey {
  readonly source: IndicatorSource;
  readonly code: string;
}

const INDICATORS_ROUTE = '/api/indicators';

const indicatorsResponseSchema = z.array(indicatorSummarySchema);

export function fetchIndicators(fetchFunction: FetchFunction = browserFetch): Promise<IndicatorSummary[]> {
  return getJson(fetchFunction, INDICATORS_ROUTE, indicatorsResponseSchema);
}

export function fetchIndicatorObservations(key: IndicatorKey, range: DateRange, fetchFunction: FetchFunction = browserFetch): Promise<IndicatorObservations> {
  const query = new URLSearchParams({ from: range.from, to: range.to });
  return getJson(fetchFunction, `${indicatorRoute(key)}/observations?${query.toString()}`, indicatorObservationsSchema);
}

export function fetchIndicatorPeriods(key: IndicatorKey, fetchFunction: FetchFunction = browserFetch): Promise<IndicatorPeriods> {
  return getJson(fetchFunction, `${indicatorRoute(key)}/periods`, indicatorPeriodsSchema);
}

function indicatorRoute(key: IndicatorKey): string {
  return `${INDICATORS_ROUTE}/${key.source}/${encodeURIComponent(key.code)}`;
}
