import { loadConfig } from '../config/env';
import { createContainer } from '../container';
import { closeDatabaseClient } from '../database/client';
import { parseBackfillArguments } from '../modules/sync/backfill-arguments';
import { SystemClock } from '../shared/clock';

async function runBackfill(): Promise<void> {
  const config = loadConfig(process.env);
  const { from, to } = parseBackfillArguments(process.argv.slice(2), new SystemClock().today());
  const { database, syncService, indicatorSyncService, logger } = createContainer(config);
  try {
    logger.info({ from: from.toString(), to: to.toString() }, 'Backfill started');
    const report = await syncService.backfill(from, to);
    logger.info({ report }, 'Backfill finished');
    const indicatorReport = await indicatorSyncService.backfill(from, to);
    logger.info({ report: indicatorReport }, 'Indicator backfill finished');
  } finally {
    await closeDatabaseClient(database);
  }
}

runBackfill().catch((error: unknown) => {
  process.stderr.write(`Backfill failed: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`);
  process.exit(1);
});
