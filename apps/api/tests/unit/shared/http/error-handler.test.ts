import express, { type Express } from 'express';
import request from 'supertest';
import { InvalidValueError } from '../../../../src/shared/errors/invalid-value-error';
import { createErrorHandler, notFoundHandler } from '../../../../src/shared/http/error-handler';
import type { AppLogger } from '../../../../src/shared/logger';

interface LoggerSpies {
  readonly logger: AppLogger;
  readonly error: jest.Mock;
}

function fakeLogger(): LoggerSpies {
  const error = jest.fn();
  return { logger: { info: jest.fn(), warn: jest.fn(), error }, error };
}

function appThrowing(failure: unknown, logger: AppLogger): Express {
  const app = express();
  app.get('/boom', () => {
    throw failure;
  });
  app.use(notFoundHandler());
  app.use(createErrorHandler(logger));
  return app;
}

describe('createErrorHandler', () => {
  it('should respond 400 with the error code and message when an InvalidValueError is thrown', async () => {
    const { logger, error } = fakeLogger();

    const response = await request(appThrowing(new InvalidValueError("Invalid calendar date '2026-02-30'"), logger)).get('/boom');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: { code: 'INVALID_VALUE', message: "Invalid calendar date '2026-02-30'" } });
    expect(error).not.toHaveBeenCalled();
  });

  it('should respond 500 without leaking details and log the error when an unexpected error is thrown', async () => {
    const { logger, error } = fakeLogger();
    const failure = new Error('database password is hunter2');

    const response = await request(appThrowing(failure, logger)).get('/boom');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
    expect(error).toHaveBeenCalledWith({ err: failure }, 'Unhandled request error');
  });
});

describe('notFoundHandler', () => {
  it('should respond 404 with the method and path when no route matches', async () => {
    const response = await request(appThrowing(new Error('unused'), fakeLogger().logger)).post('/missing');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Route POST /missing not found' } });
  });
});
