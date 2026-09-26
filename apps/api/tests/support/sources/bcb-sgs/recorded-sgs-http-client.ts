import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GetJsonOptions, HttpClient } from '../../../../src/modules/sync/sources/http-client';

export type RecordedSgsPeriod =
  | '2024-01-01-to-2024-12-31'
  | '2024-01-01-to-2026-09-24'
  | '2026-06-01-to-2026-09-24'
  | '2026-09-23-to-2026-09-24';

export interface SgsRecordings {
  readonly metadata?: boolean;
  readonly periods?: readonly RecordedSgsPeriod[];
  readonly failures?: Readonly<Record<string, Error>>;
}

export interface RecordedSgsPost {
  readonly url: string;
  readonly body: string;
  readonly headers: Readonly<Record<string, string>>;
}

const RECORDINGS_DIRECTORY = join(__dirname, '../../../fixtures/bcb-sgs');
const SERIES_IN_URL_PATTERN = /bcdata\.sgs\.(\d+)\/dados/;
const SERIES_IN_SOAP_PATTERN = /<in0>(\d+)<\/in0>/;

export class RecordedSgsHttpClient implements HttpClient {
  readonly requestedUrls: string[] = [];
  readonly requestedOptions: (GetJsonOptions | undefined)[] = [];
  readonly posts: RecordedSgsPost[] = [];

  constructor(private readonly recordings: SgsRecordings) {}

  getJson(url: string, options?: GetJsonOptions): Promise<unknown> {
    this.requestedUrls.push(url);
    this.requestedOptions.push(options);
    try {
      const recording = readFileSync(join(RECORDINGS_DIRECTORY, this.observationsRecording(new URL(url))), 'utf8');
      return Promise.resolve(JSON.parse(recording));
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  postText(url: string, body: string, headers: Readonly<Record<string, string>>): Promise<string> {
    this.posts.push({ url, body, headers });
    try {
      return Promise.resolve(readFileSync(join(RECORDINGS_DIRECTORY, this.metadataRecording(body)), 'utf8'));
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  observationUrlsFor(seriesCode: string): URL[] {
    return this.requestedUrls.map((url) => new URL(url)).filter((url) => SERIES_IN_URL_PATTERN.exec(url.pathname)?.[1] === seriesCode);
  }

  private observationsRecording(url: URL): string {
    const seriesCode = SERIES_IN_URL_PATTERN.exec(url.pathname)?.[1] ?? '';
    this.throwRecordedFailure(seriesCode);
    const period = `${fromSgsDate(url.searchParams.get('dataInicial'))}-to-${fromSgsDate(url.searchParams.get('dataFinal'))}`;
    const recording = join('observations', period, `${seriesCode}.json`);
    const isRecorded = (this.recordings.periods ?? []).some((recorded) => recorded === period);
    if (!isRecorded || !existsSync(join(RECORDINGS_DIRECTORY, recording))) {
      throw new Error(`No recorded SGS observations for series ${seriesCode} ${period}`);
    }
    return recording;
  }

  private metadataRecording(body: string): string {
    const seriesCode = SERIES_IN_SOAP_PATTERN.exec(body)?.[1] ?? '';
    this.throwRecordedFailure(seriesCode);
    const recording = join('metadata', `${seriesCode}.xml`);
    if (this.recordings.metadata !== true || !existsSync(join(RECORDINGS_DIRECTORY, recording))) {
      throw new Error(`No recorded SGS metadata for series ${seriesCode}`);
    }
    return recording;
  }

  private throwRecordedFailure(seriesCode: string): void {
    const failure = this.recordings.failures?.[seriesCode];
    if (failure !== undefined) throw failure;
  }
}

function fromSgsDate(sgsDate: string | null): string {
  const [day, month, year] = (sgsDate ?? '').split('/');
  return `${year ?? ''}-${month ?? ''}-${day ?? ''}`;
}
