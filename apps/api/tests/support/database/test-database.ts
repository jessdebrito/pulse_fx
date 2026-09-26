import { closeDatabaseClient, createDatabaseClient, type DatabaseClient } from '../../../src/database/client';
import type { Currency } from '../../../src/modules/currencies';
import type { Indicator } from '../../../src/modules/indicators';
import { testDatabaseUrl } from './test-database-url';


export function connectTestDatabase(): DatabaseClient {
  return createDatabaseClient(testDatabaseUrl());
}

export function disconnectTestDatabase(client: DatabaseClient): Promise<void> {
  return closeDatabaseClient(client);
}

export async function resetTestDatabase(client: DatabaseClient): Promise<void> {
  await client.prisma.$executeRaw`truncate table sync_state, currency_quotes, currencies, indicator_sync_state, indicator_observations, indicators`;
}

export async function insertCurrencies(client: DatabaseClient, currencies: readonly Currency[]): Promise<void> {
  await client.prisma.currency.createMany({ data: [...currencies] });
}

export async function insertIndicators(client: DatabaseClient, indicators: readonly Indicator[]): Promise<void> {
  await client.prisma.indicator.createMany({ data: [...indicators] });
}
