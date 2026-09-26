import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../errors/app-error';
import type { AppLogger } from '../logger';

const HTTP_STATUS_BY_ERROR_CODE: Readonly<Record<string, number>> = Object.freeze({
  INVALID_VALUE: 400,
});

const INTERNAL_ERROR_STATUS = 500;
const NOT_FOUND_STATUS = 404;

export function notFoundHandler(): RequestHandler {
  return (request, response) => {
    response.status(NOT_FOUND_STATUS).json({
      error: { code: 'NOT_FOUND', message: `Route ${request.method} ${request.path} not found` },
    });
  };
}

export function createErrorHandler(logger: AppLogger): ErrorRequestHandler {
  return (error: unknown, _request, response, _next) => {
    const status = error instanceof AppError ? HTTP_STATUS_BY_ERROR_CODE[error.code] : undefined;
    if (!(error instanceof AppError) || status === undefined) {
      logger.error({ err: error }, 'Unhandled request error');
      response.status(INTERNAL_ERROR_STATUS).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
      return;
    }
    response.status(status).json({ error: { code: error.code, message: error.message } });
  };
}
