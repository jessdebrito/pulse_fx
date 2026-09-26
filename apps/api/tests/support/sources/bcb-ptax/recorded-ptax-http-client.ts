import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { HttpClient } from '../../../../src/modules/sync/sources/http-client';

export type RecordedPeriod =
  | '2025-12-30-to-2025-12-31'
  | '2025-12-30-to-2026-01-02'
  | '2026-01-01-to-2026-01-02'
  | '2026-09-19-to-2026-09-20'
  | '2026-09-22-to-2026-09-24'
  | '2026-09-23-to-2026-09-24';

export interface PtaxRecordings {
  readonly catalog?: boolean | Error;
  readonly periods?: readonly RecordedPeriod[];
  readonly failures?: Readonly<Record<string, Error>>;
}

interface QuoteRequest {
  readonly currency: string;
  readonly period: string;
}

const RECORDINGS_DIRECTORY = join(__dirname, '../../../fixtures/bcb-ptax');
const CATALOG_RECORDING = 'currencies.json';

export class RecordedPtaxHttpClient implements HttpClient {
  readonly requestedUrls: string[] = [];

  constructor(private readonly recordings: PtaxRecordings) {}

  getJson(url: string): Promise<unknown> {
    this.requestedUrls.push(url);
    try {
      const recording = readFileSync(join(RECORDINGS_DIRECTORY, this.recordingFor(url)), 'utf8');
      return Promise.resolve(JSON.parse(recording));
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  postText(url: string): Promise<string> {
    return Promise.reject(new Error(`PTAX is never called with POST (${url})`));
  }

  quoteUrlsFor(currencyCode: string): string[] {
    return this.requestedUrls.filter((url) => url.includes(`@moeda='${currencyCode}'`));
  }

  private recordingFor(url: string): string {
    if (url.includes('/Moedas?')) return this.catalogRecording();
    const request = quoteRequestOf(url);
    const failure = this.recordings.failures?.[request.currency];
    if (failure !== undefined) throw failure;
    const recording = join('quotes', request.period, `${request.currency.toLowerCase()}.json`);
    const isRecorded = (this.recordings.periods ?? []).some((period) => period === request.period);
    if (!isRecorded || !existsSync(join(RECORDINGS_DIRECTORY, recording))) {
      throw new Error(`No recorded PTAX response for ${request.currency} ${request.period}`);
    }
    return recording;
  }

  private catalogRecording(): string {
    const catalog = this.recordings.catalog;
    if (catalog instanceof Error) throw catalog;
    if (catalog !== true) throw new Error('No recorded PTAX currency catalog');
    return CATALOG_RECORDING;
  }
}

function quoteRequestOf(url: string): QuoteRequest {
  const parameter = (name: string): string => new RegExp(`@${name}='([^']+)'`).exec(url)?.[1] ?? '';
  return {
    currency: parameter('moeda'),
    period: `${fromBcbDate(parameter('dataInicial'))}-to-${fromBcbDate(parameter('dataFinalCotacao'))}`,
  };
}

function fromBcbDate(bcbDate: string): string {
  const [month, day, year] = bcbDate.split('-');
  return `${year}-${month}-${day}`;
}
