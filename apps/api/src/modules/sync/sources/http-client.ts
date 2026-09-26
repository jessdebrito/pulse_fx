import { setTimeout as delay } from 'node:timers/promises';
import { ExternalSourceError } from '../sync.errors';

export interface GetJsonOptions {
  readonly acceptedStatuses?: readonly number[];
}

export interface HttpClient {
  getJson(url: string, options?: GetJsonOptions): Promise<unknown>;
  postText(url: string, body: string, headers: Readonly<Record<string, string>>): Promise<string>;
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

const SECRET_QUERY_PARAMETER_PATTERN = /([?&]api_key=)[^&]*/g;
const REDACTED_VALUE = '***';

export class FetchHttpClient implements HttpClient {
  private readonly fetchFunction: FetchFunction;
  private readonly sleep: SleepFunction;

  constructor(private readonly options: FetchHttpClientOptions) {
    this.fetchFunction = options.fetchFunction ?? ((url, init): Promise<Response> => fetch(url, init));
    this.sleep = options.sleep ?? ((milliseconds): Promise<void> => delay(milliseconds));
  }

  getJson(url: string, options: GetJsonOptions = {}): Promise<unknown> {
    const request = `GET ${redactSecrets(url)}`;
    return this.withRetry(request, async () => {
      const response = await this.send(request, url, { headers: { accept: 'application/json' } }, options.acceptedStatuses ?? []);
      const body: unknown = await response.json();
      return body;
    });
  }

  postText(url: string, body: string, headers: Readonly<Record<string, string>>): Promise<string> {
    const request = `POST ${redactSecrets(url)}`;
    return this.withRetry(request, async () => {
      const response = await this.send(request, url, { method: 'POST', headers: { ...headers }, body }, []);
      return response.text();
    });
  }

  private async withRetry<T>(request: string, attempt: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attemptNumber = 1; attemptNumber <= this.options.maxAttempts; attemptNumber += 1) {
      try {
        return await attempt();
      } catch (error) {
        lastError = error;
        if (attemptNumber < this.options.maxAttempts) await this.sleep(this.options.retryDelayMs);
      }
    }
    throw new ExternalSourceError(`${request} failed after ${this.options.maxAttempts} attempts`, { cause: lastError });
  }

  private async send(request: string, url: string, init: RequestInit, acceptedStatuses: readonly number[]): Promise<Response> {
    const response = await this.fetchFunction(url, { ...init, signal: AbortSignal.timeout(this.options.timeoutMs) });
    if (!response.ok && !acceptedStatuses.includes(response.status)) {
      throw new ExternalSourceError(`${request} responded with HTTP ${response.status}`);
    }
    return response;
  }
}

function redactSecrets(url: string): string {
  return url.replace(SECRET_QUERY_PARAMETER_PATTERN, `$1${REDACTED_VALUE}`);
}
