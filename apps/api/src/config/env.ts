import cron from 'node-cron';
import { z } from 'zod';
import { InvalidValueError } from '../shared/errors/invalid-value-error';

const DEFAULT_PORT = 4000;
const DEFAULT_SYNC_OPENING_CRON = '15 10 * * 1-5';
const DEFAULT_SYNC_CLOSING_CRON = '15 13 * * 1-5';

const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

export interface AppConfig {
  readonly databaseUrl: string;
  readonly port: number;
  readonly syncOpeningCron: string;
  readonly syncClosingCron: string;
  readonly logLevel: LogLevel;
}

const cronExpression = z.string().refine((expression) => cron.validate(expression), { message: 'Invalid cron expression' });

const envSchema = z.object({
  DATABASE_URL: z.url(),
  PORT: z.coerce.number().int().positive().default(DEFAULT_PORT),
  SYNC_OPENING_CRON: cronExpression.default(DEFAULT_SYNC_OPENING_CRON),
  SYNC_CLOSING_CRON: cronExpression.default(DEFAULT_SYNC_CLOSING_CRON),
  LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
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
  });
}
