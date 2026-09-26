import express, { type Express } from 'express';
import { createCurrenciesRouter, type CurrenciesReader } from './modules/currencies';
import { createErrorHandler, notFoundHandler } from './shared/http/error-handler';
import type { AppLogger } from './shared/logger';

export interface AppDependencies {
  readonly logger: AppLogger;
  readonly currenciesService: CurrenciesReader;
}

export function createApp(dependencies: AppDependencies): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  app.use('/api', createCurrenciesRouter(dependencies.currenciesService));
  app.use(notFoundHandler());
  app.use(createErrorHandler(dependencies.logger));
  return app;
}
