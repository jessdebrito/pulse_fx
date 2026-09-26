import type { z } from 'zod';

export interface HttpResponse {
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
}

export type FetchFunction = (url: string) => Promise<HttpResponse>;

export const browserFetch: FetchFunction = (url) => fetch(url);

export async function getJson<T>(fetchFunction: FetchFunction, url: string, schema: z.ZodType<T>): Promise<T> {
  const response = await fetchFunction(url);
  if (!response.ok) {
    throw new Error(`GET ${url} responded with HTTP ${response.status}`);
  }
  return schema.parse(await response.json());
}
