import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../generated/prisma/client';

export type Database = PrismaClient;

export interface DatabaseClient {
  readonly prisma: PrismaClient;
  readonly pool: Pool;
}

export function createDatabaseClient(connectionString: string): DatabaseClient {
  const pool = new Pool({ connectionString });
  return { pool, prisma: new PrismaClient({ adapter: new PrismaPg(pool) }) };
}

export async function closeDatabaseClient(client: DatabaseClient): Promise<void> {
  await client.prisma.$disconnect();
  await client.pool.end();
}
