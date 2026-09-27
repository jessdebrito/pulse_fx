import type { z } from 'zod';

export interface HttpResponse {
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
}

export type FetchFunction = (url: string, init?: RequestInit) => Promise<HttpResponse>;

export const browserFetch: FetchFunction = (url, init) => fetch(url, init);

export interface CommandInit extends RequestInit {
  readonly method: string;
}

export async function getJson<T>(fetchFunction: FetchFunction, url: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const response = await (init === undefined ? fetchFunction(url) : fetchFunction(url, init));
  if (!response.ok) {
    throw new Error(`GET ${url} responded with HTTP ${response.status}`);
  }
  return schema.parse(await response.json());
}

export async function sendCommand(fetchFunction: FetchFunction, url: string, init: CommandInit): Promise<void> {
  const response = await fetchFunction(url, init);
  if (!response.ok) {
    throw new Error(`${init.method} ${url} responded with HTTP ${response.status}`);
  }
}
