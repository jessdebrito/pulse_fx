import { Router, type Request } from 'express';
import { CalendarDate } from '../../shared/calendar-date';
import { InvalidValueError } from '../../shared/errors/invalid-value-error';
import type { IndicatorsReader } from './indicators.service';
import type { IndicatorKey, IndicatorSource } from './indicators.types';

const INDICATOR_SOURCES: readonly IndicatorSource[] = Object.freeze(['fred', 'sgs']);
const INDICATOR_CODE_PATTERN = /^[A-Z0-9_]{1,40}$/;

interface IndicatorParameters {
  readonly source: string;
  readonly code: string;
}

interface ObservationsRequest {
  readonly key: IndicatorKey;
  readonly from: CalendarDate;
  readonly to: CalendarDate;
}

export function createIndicatorsRouter(service: IndicatorsReader): Router {
  const router = Router();
  router.get('/indicators', async (_request, response) => {
    response.json(await service.listWithLatestObservation());
  });
  router.get('/indicators/:source/:code/periods', async (request: Request<IndicatorParameters>, response) => {
    response.json(await service.getAvailablePeriods(parseIndicatorKey(request.params)));
  });
  router.get('/indicators/:source/:code/observations', async (request: Request<IndicatorParameters>, response) => {
    const { key, from, to } = parseObservationsRequest(request);
    response.json(await service.getObservations(key, from, to));
  });
  return router;
}

function parseIndicatorKey(parameters: IndicatorParameters): IndicatorKey {
  const source = INDICATOR_SOURCES.find((candidate) => candidate === parameters.source);
  if (source === undefined) {
    throw new InvalidValueError(`Invalid indicator source '${parameters.source}', expected one of ${INDICATOR_SOURCES.join(', ')}`);
  }
  if (!INDICATOR_CODE_PATTERN.test(parameters.code)) {
    throw new InvalidValueError(`Invalid indicator code '${parameters.code}', expected uppercase letters, digits or underscores`);
  }
  return { source, code: parameters.code };
}

function parseObservationsRequest(request: Request<IndicatorParameters>): ObservationsRequest {
  const key = parseIndicatorKey(request.params);
  const from = CalendarDate.fromIso(requiredQueryParameter(request, 'from'));
  const to = CalendarDate.fromIso(requiredQueryParameter(request, 'to'));
  if (to.isBefore(from)) {
    throw new InvalidValueError(`Query parameter 'from' (${from.toString()}) must not be after 'to' (${to.toString()})`);
  }
  return { key, from, to };
}

function requiredQueryParameter(request: Request<IndicatorParameters>, name: string): string {
  const value = request.query[name];
  if (typeof value !== 'string') {
    throw new InvalidValueError(`Query parameter '${name}' is required as YYYY-MM-DD`);
  }
  return value;
}
