import cron from 'node-cron';
import { z } from 'zod';
import { InvalidValueError } from '../shared/errors/invalid-value-error';

const DEFAULT_PORT = 4000;
const DEFAULT_SYNC_OPENING_CRON = '15 10 * * 1-5';
const DEFAULT_SYNC_CLOSING_CRON = '15 13 * * 1-5';
const FRED_API_KEY_PATTERN = /^[a-z0-9]{32}$/;

const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

export interface AppConfig {
  readonly databaseUrl: string;
  readonly port: number;
  readonly syncOpeningCron: string;
  readonly syncClosingCron: string;
  readonly logLevel: LogLevel;
  readonly fredApiKey: string;
}

const cronExpression = z.string().refine((expression) => cron.validate(expression), { message: 'Invalid cron expression' });

const envSchema = z.object({
  DATABASE_URL: z.url(),
  PORT: z.coerce.number().int().positive().default(DEFAULT_PORT),
  SYNC_OPENING_CRON: cronExpression.default(DEFAULT_SYNC_OPENING_CRON),
  SYNC_CLOSING_CRON: cronExpression.default(DEFAULT_SYNC_CLOSING_CRON),
  LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
  FRED_API_KEY: z.string({ error: 'FRED_API_KEY is required' }).regex(FRED_API_KEY_PATTERN, { error: 'Expected the 32-character lowercase alphanumeric FRED API key' }),
});

export function loadConfig(env: NodeJS.ProcessEnv): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    throw new InvalidValueError(`Invalid environment configuration:\n${z.prettifyError(parsed.error)}`);
  }
  const values = parsed.data;
  return Object.freeze({
    databaseUrl: values.DATABASE_URL,
    port: values.PORT,
    syncOpeningCron: values.SYNC_OPENING_CRON,
    syncClosingCron: values.SYNC_CLOSING_CRON,
    logLevel: values.LOG_LEVEL,
    fredApiKey: values.FRED_API_KEY,
  });
}
