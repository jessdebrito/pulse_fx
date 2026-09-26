import { loadConfig } from './config/env';
import { createContainer } from './container';
import { closeDatabaseClient } from './database/client';
import { runInitialLoad, startSyncScheduler } from './modules/sync';
import { APP_TIME_ZONE } from './shared/clock';

function main(): void {
  const config = loadConfig(process.env);
  const { app, database, syncService, logger } = createContainer(config);

  const server = app.listen(config.port, () => {
    logger.info({ port: config.port }, 'API listening');
  });

  startSyncScheduler({
    expressions: [config.syncOpeningCron, config.syncClosingCron],
    timeZone: APP_TIME_ZONE,
    service: syncService,
    logger,
  });
  void runInitialLoad(syncService, logger);

  const shutdown = (): void => {
    server.close(() => {
      void closeDatabaseClient(database).then(() => process.exit(0));
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

try {
  main();
} catch (error: unknown) {
  process.stderr.write(`API failed to start: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`);
  process.exit(1);
}
