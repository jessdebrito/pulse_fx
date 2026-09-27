import { Router, type Request, type Response } from 'express';
import { ClientId } from '../../shared/client-id';
import { InvalidValueError } from '../../shared/errors/invalid-value-error';
import type { IndicatorKey, IndicatorSource } from '../indicators';
import type { FavoritesManager } from './favorites.service';

const CLIENT_ID_HEADER = 'x-client-id';
const NO_CONTENT_STATUS = 204;
const INDICATOR_SOURCES: readonly IndicatorSource[] = Object.freeze(['fred', 'sgs']);

interface CurrencyParameters {
  readonly code: string;
}

interface IndicatorParameters {
  readonly source: string;
  readonly code: string;
}

export function createFavoritesRouter(service: FavoritesManager): Router {
  const router = Router();
  router.get('/favorites', async (request, response) => {
    response.json(await service.list(clientIdOf(request)));
  });
  router.put('/favorites/currencies/:code', async (request: Request<CurrencyParameters>, response) => {
    await service.addCurrency(clientIdOf(request), request.params.code);
    noContent(response);
  });
  router.delete('/favorites/currencies/:code', async (request: Request<CurrencyParameters>, response) => {
    await service.removeCurrency(clientIdOf(request), request.params.code);
    noContent(response);
  });
  router.put('/favorites/indicators/:source/:code', async (request: Request<IndicatorParameters>, response) => {
    await service.addIndicator(clientIdOf(request), indicatorKeyOf(request.params));
    noContent(response);
  });
  router.delete('/favorites/indicators/:source/:code', async (request: Request<IndicatorParameters>, response) => {
    await service.removeIndicator(clientIdOf(request), indicatorKeyOf(request.params));
    noContent(response);
  });
  return router;
}

function clientIdOf<P>(request: Request<P>): ClientId {
  return ClientId.fromString(request.header(CLIENT_ID_HEADER));
}

function indicatorKeyOf(parameters: IndicatorParameters): IndicatorKey {
  const source = INDICATOR_SOURCES.find((candidate) => candidate === parameters.source);
  if (source === undefined) {
    throw new InvalidValueError(`Invalid indicator source '${parameters.source}', expected one of ${INDICATOR_SOURCES.join(', ')}`);
  }
  return { source, code: parameters.code };
}

function noContent(response: Response): void {
  response.status(NO_CONTENT_STATUS).end();
}
