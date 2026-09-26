import { z } from 'zod';
import { CalendarDate } from '../../../shared/calendar-date';
import type { Indicator, IndicatorFrequency, IndicatorObservation } from '../../indicators';
import { DECIMAL_TEXT_PATTERN, FRED_BASE_URL } from '../sync.constants';
import { ExternalSourceError } from '../sync.errors';
import type { HttpClient } from './http-client';
import type { IndicatorSourceClient } from './indicator-source.client';

const MISSING_VALUE = '.';

const FREQUENCY_BY_SHORT_CODE: Readonly<Record<string, IndicatorFrequency>> = Object.freeze({
  D: 'daily',
  W: 'weekly',
  M: 'monthly',
  Q: 'quarterly',
  A: 'annual',
});

const seriesSchema = z.object({
  seriess: z
    .array(
      z.object({
        title: z.string().min(1),
        units: z.string().min(1),
        frequency_short: z.string().min(1),
      }),
    )
    .length(1),
});

const observationsSchema = z.object({
  observations: z.array(
    z.object({
      date: z.iso.date(),
      value: z.union([z.literal(MISSING_VALUE), z.string().regex(DECIMAL_TEXT_PATTERN)]),
    }),
  ),
});

export class FredClient implements IndicatorSourceClient {
  constructor(
    private readonly http: HttpClient,
    private readonly apiKey: string,
    private readonly baseUrl: string = FRED_BASE_URL,
  ) {}

  async fetchIndicator(code: string): Promise<Indicator> {
    const payload = await this.http.getJson(this.url('series', { series_id: code }));
    const [series] = parsePayload(seriesSchema, payload, `${code} series`).seriess;
    if (series === undefined) throw new ExternalSourceError(`FRED returned no metadata for series ${code}`);
    return { source: 'fred', code, name: series.title, unit: series.units, frequency: toFrequency(series.frequency_short, code) };
  }

  async fetchObservations(code: string, from: CalendarDate, to: CalendarDate): Promise<IndicatorObservation[]> {
    const url = this.url('series/observations', { series_id: code, observation_start: from.toString(), observation_end: to.toString() });
    const { observations } = parsePayload(observationsSchema, await this.http.getJson(url), `${code} observations`);
    return observations
      .filter((observation) => observation.value !== MISSING_VALUE)
      .map((observation) => ({ date: CalendarDate.fromIso(observation.date), value: observation.value }));
  }

  private url(resource: string, parameters: Readonly<Record<string, string>>): string {
    const query = new URLSearchParams({ ...parameters, api_key: this.apiKey, file_type: 'json' });
    return `${this.baseUrl}/${resource}?${query.toString()}`;
  }
}

function parsePayload<T>(schema: z.ZodType<T>, payload: unknown, subject: string): T {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new ExternalSourceError(`Unexpected FRED ${subject} payload: ${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

function toFrequency(shortCode: string, code: string): IndicatorFrequency {
  const frequency = FREQUENCY_BY_SHORT_CODE[shortCode];
  if (frequency === undefined) throw new ExternalSourceError(`Unsupported FRED frequency '${shortCode}' for series ${code}`);
  return frequency;
}
