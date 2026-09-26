import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import {
  indicatorObservationsSchema,
  indicatorPeriodsSchema,
  indicatorSummarySchema,
  type IndicatorObservations,
  type IndicatorPeriods,
  type IndicatorSummary,
} from '../../../src/api/indicators';

function readFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(__dirname, '../../fixtures/api', name), 'utf8'));
}

export function recordedIndicatorsResponse(): unknown {
  return readFixture('indicators.json');
}

export function recordedIndicatorSummaries(): IndicatorSummary[] {
  return z.array(indicatorSummarySchema).parse(recordedIndicatorsResponse());
}

export function recordedIndicator(source: IndicatorSummary['source'], code: string): IndicatorSummary {
  const indicator = recordedIndicatorSummaries().find((item) => item.source === source && item.code === code);
  if (indicator === undefined) throw new Error(`Indicator ${source}/${code} is not in the recorded API response`);
  return indicator;
}

export function recordedUsImportsFromBrazilPeriodsResponse(): unknown {
  return readFixture('indicator-periods-fred-imp3510.json');
}

export function recordedUsImportsFromBrazilPeriods(): IndicatorPeriods {
  return indicatorPeriodsSchema.parse(recordedUsImportsFromBrazilPeriodsResponse());
}

export function recordedUsImportsFromBrazilObservationsResponse(): unknown {
  return readFixture('indicator-observations-fred-imp3510.json');
}

export function recordedUsImportsFromBrazilObservations(): IndicatorObservations {
  return indicatorObservationsSchema.parse(recordedUsImportsFromBrazilObservationsResponse());
}

export function recordedCustomsDutiesObservations(): IndicatorObservations {
  return indicatorObservationsSchema.parse(readFixture('indicator-observations-fred-b235rc1q027sbea.json'));
}
