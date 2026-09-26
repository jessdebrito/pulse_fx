import { CalendarDate } from '../../../../../src/shared/calendar-date';
import { FredClient } from '../../../../../src/modules/sync/sources/fred.client';
import type { HttpClient } from '../../../../../src/modules/sync/sources/http-client';
import { ExternalSourceError } from '../../../../../src/modules/sync/sync.errors';
import { RecordedFredHttpClient, TEST_FRED_API_KEY } from '../../../../support/sources/fred/recorded-fred-http-client';

const JUNE_1 = CalendarDate.fromIso('2026-06-01');
const SEP_24 = CalendarDate.fromIso('2026-09-24');

function clientReturning(payload: unknown): FredClient {
  const http: HttpClient = { getJson: () => Promise.resolve(payload), postText: jest.fn() };
  return new FredClient(http, TEST_FRED_API_KEY);
}

describe('FredClient.fetchIndicator', () => {
  it('should return the title, units and frequency published by FRED when the series exists', async () => {
    const client = new FredClient(new RecordedFredHttpClient({ series: true }), TEST_FRED_API_KEY);

    await expect(client.fetchIndicator('IMP3510')).resolves.toEqual({
      source: 'fred',
      code: 'IMP3510',
      name: 'U.S. Imports of Goods by Customs Basis from Brazil',
      unit: 'Millions of Dollars',
      frequency: 'monthly',
    });
  });

  it('should map the quarterly frequency when the series is published every quarter', async () => {
    const client = new FredClient(new RecordedFredHttpClient({ series: true }), TEST_FRED_API_KEY);

    await expect(client.fetchIndicator('B235RC1Q027SBEA')).resolves.toMatchObject({ unit: 'Billions of Dollars', frequency: 'quarterly' });
  });

  it('should request the series resource in JSON with the api key when fetching the metadata', async () => {
    const http = new RecordedFredHttpClient({ series: true });

    await new FredClient(http, TEST_FRED_API_KEY, 'https://fred.test/fred').fetchIndicator('IMP3510');

    const url = new URL(http.requestedUrls[0] ?? '');
    expect(`${url.origin}${url.pathname}`).toBe('https://fred.test/fred/series');
    expect(Object.fromEntries(url.searchParams)).toEqual({ series_id: 'IMP3510', api_key: TEST_FRED_API_KEY, file_type: 'json' });
  });

  it('should throw ExternalSourceError naming the frequency when FRED publishes an unsupported one', async () => {
    const payload = { seriess: [{ id: 'IMP3510', title: 'U.S. Imports of Goods by Customs Basis from Brazil', units: 'Millions of Dollars', frequency_short: 'BW' }] };
    const fetchIndicator = (): Promise<unknown> => clientReturning(payload).fetchIndicator('IMP3510');

    await expect(fetchIndicator()).rejects.toThrow(ExternalSourceError);
    await expect(fetchIndicator()).rejects.toThrow(/BW/);
  });

  it('should throw ExternalSourceError when the metadata does not match the FRED format', async () => {
    await expect(clientReturning({ seriess: [] }).fetchIndicator('IMP3510')).rejects.toThrow(ExternalSourceError);
  });
});

describe('FredClient.fetchObservations', () => {
  it('should return every observation with the exact decimal text published by FRED when the period has data', async () => {
    const client = new FredClient(new RecordedFredHttpClient({ periods: ['2026-06-01-to-2026-09-24'] }), TEST_FRED_API_KEY);

    const observations = await client.fetchObservations('EPUTRADE', JUNE_1, SEP_24);

    expect(observations).toEqual([
      { date: CalendarDate.fromIso('2026-06-01'), value: '1230.8591361576214' },
      { date: CalendarDate.fromIso('2026-07-01'), value: '1248.2368946779902' },
    ]);
  });

  it('should request the observations of the period in JSON with the api key', async () => {
    const http = new RecordedFredHttpClient({ periods: ['2026-06-01-to-2026-09-24'] });

    await new FredClient(http, TEST_FRED_API_KEY, 'https://fred.test/fred').fetchObservations('IMP3510', JUNE_1, SEP_24);

    const url = new URL(http.requestedUrls[0] ?? '');
    expect(`${url.origin}${url.pathname}`).toBe('https://fred.test/fred/series/observations');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      series_id: 'IMP3510',
      api_key: TEST_FRED_API_KEY,
      file_type: 'json',
      observation_start: '2026-06-01',
      observation_end: '2026-09-24',
    });
  });

  it('should skip the dates FRED publishes without a value when the series has gaps', async () => {
    const client = new FredClient(new RecordedFredHttpClient({ periods: ['2026-09-01-to-2026-09-10'] }), TEST_FRED_API_KEY);

    const observations = await client.fetchObservations('DEXBZUS', CalendarDate.fromIso('2026-09-01'), CalendarDate.fromIso('2026-09-10'));

    expect(observations.map((observation) => observation.date.toString())).toEqual([
      '2026-09-01',
      '2026-09-02',
      '2026-09-03',
      '2026-09-04',
      '2026-09-08',
      '2026-09-09',
      '2026-09-10',
    ]);
  });

  it('should return an empty list when the period has no observations', async () => {
    const client = new FredClient(new RecordedFredHttpClient({ periods: ['2026-09-23-to-2026-09-24'] }), TEST_FRED_API_KEY);

    await expect(client.fetchObservations('IMP3510', CalendarDate.fromIso('2026-09-23'), SEP_24)).resolves.toEqual([]);
  });

  it('should throw ExternalSourceError when a value is not a decimal number', async () => {
    const payload = { observations: [{ date: '2026-07-01', value: 'n/a' }] };

    await expect(clientReturning(payload).fetchObservations('IMP3510', JUNE_1, SEP_24)).rejects.toThrow(ExternalSourceError);
  });
});
