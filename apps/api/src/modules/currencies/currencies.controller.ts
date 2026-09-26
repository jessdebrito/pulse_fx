import { Router, type Request } from 'express';
import { CalendarDate } from '../../shared/calendar-date';
import { InvalidValueError } from '../../shared/errors/invalid-value-error';
import type { CurrenciesReader } from './currencies.service';

const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

interface QuotesRequest {
  readonly code: string;
  readonly from: CalendarDate;
  readonly to: CalendarDate;
}

export function createCurrenciesRouter(service: CurrenciesReader): Router {
  const router = Router();
  router.get('/currencies', async (_request, response) => {
    response.json(await service.listWithLatestQuote());
  });
  router.get('/currencies/:code/periods', async (request: Request<{ code: string }>, response) => {
    response.json(await service.getAvailablePeriods(parseCurrencyCode(request.params.code)));
  });
  router.get('/currencies/:code/quotes', async (request, response) => {
    const { code, from, to } = parseQuotesRequest(request);
    response.json(await service.getQuotes(code, from, to));
  });
  return router;
}

function parseCurrencyCode(code: string): string {
  if (!CURRENCY_CODE_PATTERN.test(code)) {
    throw new InvalidValueError(`Invalid currency code '${code}', expected three uppercase letters`);
  }
  return code;
}

function parseQuotesRequest(request: Request<{ code: string }>): QuotesRequest {
  const code = parseCurrencyCode(request.params.code);
  const from = CalendarDate.fromIso(requiredQueryParameter(request, 'from'));
  const to = CalendarDate.fromIso(requiredQueryParameter(request, 'to'));
  if (to.isBefore(from)) {
    throw new InvalidValueError(`Query parameter 'from' (${from.toString()}) must not be after 'to' (${to.toString()})`);
  }
  return { code, from, to };
}

function requiredQueryParameter(request: Request<{ code: string }>, name: string): string {
  const value = request.query[name];
  if (typeof value !== 'string') {
    throw new InvalidValueError(`Query parameter '${name}' is required as YYYY-MM-DD`);
  }
  return value;
}
