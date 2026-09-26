import { setTimeout as delay } from 'node:timers/promises';
import { ExternalSourceError } from '../sync.errors';

export interface HttpClient {
  getJson(url: string): Promise<unknown>;
}

export type FetchFunction = (url: string, init: RequestInit) => Promise<Response>;

export type SleepFunction = (milliseconds: number) => Promise<void>;

export interface FetchHttpClientOptions {
  readonly timeoutMs: number;
  readonly maxAttempts: number;
  readonly retryDelayMs: number;
  readonly fetchFunction?: FetchFunction;
  readonly sleep?: SleepFunction;
}

export class FetchHttpClient implements HttpClient {
  private readonly fetchFunction: FetchFunction;
  private readonly sleep: SleepFunction;

  constructor(private readonly options: FetchHttpClientOptions) {
    this.fetchFunction = options.fetchFunction ?? ((url, init): Promise<Response> => fetch(url, init));
    this.sleep = options.sleep ?? ((milliseconds): Promise<void> => delay(milliseconds));
  }

  async getJson(url: string): Promise<unknown> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= this.options.maxAttempts; attempt += 1) {
      try {
        return await this.requestOnce(url);
      } catch (error) {
        lastError = error;
        if (attempt < this.options.maxAttempts) await this.sleep(this.options.retryDelayMs);
      }
    }
    throw new ExternalSourceError(`GET ${url} failed after ${this.options.maxAttempts} attempts`, { cause: lastError });
  }

  private async requestOnce(url: string): Promise<unknown> {
    const response = await this.fetchFunction(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(this.options.timeoutMs),
    });
    if (!response.ok) {
      throw new ExternalSourceError(`GET ${url} responded with HTTP ${response.status}`);
    }
    const body: unknown = await response.json();
    return body;
  }
}
