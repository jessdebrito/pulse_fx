import pino from 'pino';

export interface AppLogger {
  info(context: object, message: string): void;
  warn(context: object, message: string): void;
  error(context: object, message: string): void;
}

export function createLogger(level: string): AppLogger {
  return pino({ level });
}
