import type { Express } from 'express';
import { createApp } from './app';
import type { AppConfig } from './config/env';
import { createDatabaseClient, type DatabaseClient } from './database/client';
import { CurrenciesService, PrismaCurrencyQuoteRepository, PrismaCurrencyRepository } from './modules/currencies';
import { IndicatorsService, PrismaIndicatorObservationRepository, PrismaIndicatorRepository } from './modules/indicators';
import { IndicatorSyncService, SyncService } from './modules/sync';
import { PrismaIndicatorSyncStateRepository } from './modules/sync/indicator-sync-state.repository';
import { BcbPtaxClient } from './modules/sync/sources/bcb-ptax.client';
import { BcbSgsClient } from './modules/sync/sources/bcb-sgs.client';
import { FredClient } from './modules/sync/sources/fred.client';
import { FetchHttpClient } from './modules/sync/sources/http-client';
import { PgAdvisorySyncLock } from './modules/sync/sync-lock.repository';
import { PrismaSyncStateRepository } from './modules/sync/sync-state.repository';
import { HTTP_CLIENT_OPTIONS, INDICATOR_SYNC_ADVISORY_LOCK_KEY, TRACKED_INDICATORS } from './modules/sync/sync.constants';
import { SystemClock } from './shared/clock';
import { createLogger, type AppLogger } from './shared/logger';

export interface Container {
  readonly app: Express;
  readonly database: DatabaseClient;
  readonly syncService: SyncService;
  readonly indicatorSyncService: IndicatorSyncService;
  readonly logger: AppLogger;
}

export function createContainer(config: AppConfig): Container {
  const logger = createLogger(config.logLevel);
  const database = createDatabaseClient(config.databaseUrl);
  const http = new FetchHttpClient(HTTP_CLIENT_OPTIONS);
  const clock = new SystemClock();
  const currencies = new PrismaCurrencyRepository(database.prisma);
  const quotes = new PrismaCurrencyQuoteRepository(database.prisma);
  const indicators = new PrismaIndicatorRepository(database.prisma);
  const observations = new PrismaIndicatorObservationRepository(database.prisma);
  const syncService = new SyncService({
    currencies,
    quotes,
    syncStates: new PrismaSyncStateRepository(database.prisma),
    lock: new PgAdvisorySyncLock(database.pool),
    ptax: new BcbPtaxClient(http),
    clock,
  });
  const indicatorSyncService = new IndicatorSyncService({
    trackedIndicators: TRACKED_INDICATORS,
    sources: { fred: new FredClient(http, config.fredApiKey), sgs: new BcbSgsClient(http) },
    indicators,
    observations,
    syncStates: new PrismaIndicatorSyncStateRepository(database.prisma),
    lock: new PgAdvisorySyncLock(database.pool, INDICATOR_SYNC_ADVISORY_LOCK_KEY),
    clock,
  });
  const app = createApp({
    logger,
    currenciesService: new CurrenciesService({ currencies, quotes }),
    indicatorsService: new IndicatorsService({ indicators, observations }),
  });
  return { app, database, syncService, indicatorSyncService, logger };
}
