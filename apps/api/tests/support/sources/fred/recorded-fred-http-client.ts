import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { HttpClient } from '../../../../src/modules/sync/sources/http-client';

export const TEST_FRED_API_KEY = '0123456789abcdef0123456789abcdef';

export type RecordedFredPeriod =
  | '2024-01-01-to-2024-12-31'
  | '2024-01-01-to-2026-09-24'
  | '2026-06-01-to-2026-09-24'
  | '2026-09-01-to-2026-09-10'
  | '2026-09-23-to-2026-09-24';

export interface FredRecordings {
  readonly series?: boolean;
  readonly periods?: readonly RecordedFredPeriod[];
  readonly failures?: Readonly<Record<string, Error>>;
}

const RECORDINGS_DIRECTORY = join(__dirname, '../../../fixtures/fred');
const OBSERVATIONS_PATH = '/series/observations';
const SERIES_PATH = '/series';

export class RecordedFredHttpClient implements HttpClient {
  readonly requestedUrls: string[] = [];

  constructor(private readonly recordings: FredRecordings) {}

  getJson(url: string): Promise<unknown> {
    this.requestedUrls.push(url);
    try {
      const recording = readFileSync(join(RECORDINGS_DIRECTORY, this.recordingFor(new URL(url))), 'utf8');
      return Promise.resolve(JSON.parse(recording));
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  postText(url: string): Promise<string> {
    return Promise.reject(new Error(`FRED is never called with POST (${url})`));
  }

  observationUrlsFor(seriesId: string): URL[] {
    return this.requestedUrls
      .map((url) => new URL(url))
      .filter((url) => url.pathname.endsWith(OBSERVATIONS_PATH) && url.searchParams.get('series_id') === seriesId);
  }

  private recordingFor(url: URL): string {
    const seriesId = url.searchParams.get('series_id') ?? '';
    const failure = this.recordings.failures?.[seriesId];
    if (failure !== undefined) throw failure;
    if (url.pathname.endsWith(OBSERVATIONS_PATH)) return this.observationsRecording(seriesId, url);
    if (url.pathname.endsWith(SERIES_PATH)) return this.seriesRecording(seriesId);
    throw new Error(`No recorded FRED response for ${url.pathname}`);
  }

  private seriesRecording(seriesId: string): string {
    const recording = join('series', `${seriesId.toLowerCase()}.json`);
    if (this.recordings.series !== true || !existsSync(join(RECORDINGS_DIRECTORY, recording))) {
      throw new Error(`No recorded FRED series metadata for ${seriesId}`);
    }
    return recording;
  }

  private observationsRecording(seriesId: string, url: URL): string {
    const period = `${url.searchParams.get('observation_start') ?? ''}-to-${url.searchParams.get('observation_end') ?? ''}`;
    const recording = join('observations', period, `${seriesId.toLowerCase()}.json`);
    const isRecorded = (this.recordings.periods ?? []).some((recorded) => recorded === period);
    if (!isRecorded || !existsSync(join(RECORDINGS_DIRECTORY, recording))) {
      throw new Error(`No recorded FRED observations for ${seriesId} ${period}`);
    }
    return recording;
  }
}
