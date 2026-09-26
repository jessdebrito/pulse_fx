import type { Express } from 'express';
import { createApp } from './app';
import type { AppConfig } from './config/env';
import { createDatabaseClient, type DatabaseClient } from './database/client';
import { PrismaCurrencyQuoteRepository, PrismaCurrencyRepository } from './modules/currencies';
import { SyncService } from './modules/sync';
import { BcbPtaxClient } from './modules/sync/sources/bcb-ptax.client';
import { FetchHttpClient } from './modules/sync/sources/http-client';
import { PgAdvisorySyncLock } from './modules/sync/sync-lock.repository';
import { PrismaSyncStateRepository } from './modules/sync/sync-state.repository';
import { HTTP_CLIENT_OPTIONS } from './modules/sync/sync.constants';
import { SystemClock } from './shared/clock';
import { createLogger, type AppLogger } from './shared/logger';

export interface Container {
  readonly app: Express;
  readonly database: DatabaseClient;
  readonly syncService: SyncService;
  readonly logger: AppLogger;
}

export function createContainer(config: AppConfig): Container {
  const logger = createLogger(config.logLevel);
  const database = createDatabaseClient(config.databaseUrl);
  const syncService = new SyncService({
    currencies: new PrismaCurrencyRepository(database.prisma),
    quotes: new PrismaCurrencyQuoteRepository(database.prisma),
    syncStates: new PrismaSyncStateRepository(database.prisma),
    lock: new PgAdvisorySyncLock(database.pool),
    ptax: new BcbPtaxClient(new FetchHttpClient(HTTP_CLIENT_OPTIONS)),
    clock: new SystemClock(),
  });
  const app = createApp({ logger });
  return { app, database, syncService, logger };
}
