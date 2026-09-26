import express, { type Express } from 'express';
import { createErrorHandler, notFoundHandler } from './shared/http/error-handler';
import type { AppLogger } from './shared/logger';

export interface AppDependencies {
  readonly logger: AppLogger;
}

export function createApp(dependencies: AppDependencies): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  app.use(notFoundHandler());
  app.use(createErrorHandler(dependencies.logger));
  return app;
}
