import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { Client } from 'pg';
import { testDatabaseUrl } from './test-database-url';

const API_ROOT = join(__dirname, '../../..');

async function ensureDatabaseExists(url: string): Promise<void> {
  const databaseName = new URL(url).pathname.slice(1);
  const adminUrl = new URL(url);
  adminUrl.pathname = '/postgres';
  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  try {
    const existing = await admin.query('select 1 from pg_database where datname = $1', [databaseName]);
    if (existing.rowCount === 0) await admin.query(`create database "${databaseName}"`);
  } finally {
    await admin.end();
  }
}

function applyMigrations(url: string): void {
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], { cwd: API_ROOT, env: { ...process.env, DATABASE_URL: url }, stdio: 'pipe' });
}

export default async function globalSetup(): Promise<void> {
  const url = testDatabaseUrl();
  await ensureDatabaseExists(url);
  applyMigrations(url);
}
