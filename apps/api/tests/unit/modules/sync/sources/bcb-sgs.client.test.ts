import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CalendarDate } from '../../../../../src/shared/calendar-date';
import { BcbSgsClient } from '../../../../../src/modules/sync/sources/bcb-sgs.client';
import type { HttpClient } from '../../../../../src/modules/sync/sources/http-client';
import { ExternalSourceError } from '../../../../../src/modules/sync/sync.errors';
import { RecordedSgsHttpClient } from '../../../../support/sources/bcb-sgs/recorded-sgs-http-client';

const JUNE_1 = CalendarDate.fromIso('2026-06-01');
const SEP_24 = CalendarDate.fromIso('2026-09-24');
const RECORDED_27574_METADATA = readFileSync(join(__dirname, '../../../../fixtures/bcb-sgs/metadata/27574.xml'), 'utf8');

function clientAnswering(observations: unknown, metadata = ''): BcbSgsClient {
  const http: HttpClient = { getJson: () => Promise.resolve(observations), postText: () => Promise.resolve(metadata) };
  return new BcbSgsClient(http);
}

describe('BcbSgsClient.fetchIndicator', () => {
  it('should return the name, unit and frequency published by the SGS when the series exists', async () => {
    const client = new BcbSgsClient(new RecordedSgsHttpClient({ metadata: true }));

    await expect(client.fetchIndicator('27574')).resolves.toEqual({
      source: 'sgs',
      code: '27574',
      name: 'Índice de Commodities - Brasil',
      unit: 'Índice',
      frequency: 'monthly',
    });
  });

  it.each([
    ['1', 'daily'],
    ['22708', 'monthly'],
    ['22099', 'quarterly'],
    ['7326', 'annual'],
  ])('should map the SGS periodicity of series %s to %s', async (seriesCode, frequency) => {
    const client = new BcbSgsClient(new RecordedSgsHttpClient({ metadata: true }));

    await expect(client.fetchIndicator(seriesCode)).resolves.toMatchObject({ code: seriesCode, frequency });
  });

  it('should keep the official name and unit text when they have accents and symbols', async () => {
    const client = new BcbSgsClient(new RecordedSgsHttpClient({ metadata: true }));

    await expect(client.fetchIndicator('22708')).resolves.toMatchObject({
      name: 'Exportação de bens - Balanço de Pagamentos - mensal',
      unit: 'US$ (milhões)',
    });
  });

  it('should post the SOAP request for the latest value of the series to the metadata service', async () => {
    const http = new RecordedSgsHttpClient({ metadata: true });

    await new BcbSgsClient(http, 'https://sgs.test/dados/serie', 'https://sgs.test/ws').fetchIndicator('27574');

    expect(http.posts).toHaveLength(1);
    expect(http.posts[0]?.url).toBe('https://sgs.test/ws');
    expect(http.posts[0]?.body).toContain('<pub:getUltimoValorXML><in0>27574</in0></pub:getUltimoValorXML>');
    expect(http.posts[0]?.headers).toEqual({ 'content-type': 'text/xml; charset=utf-8', soapaction: '""' });
  });

  it('should throw ExternalSourceError naming the periodicity when the SGS publishes an unsupported one', async () => {
    const metadata = RECORDED_27574_METADATA.replace('&lt;PERIODICIDADE&gt;M&lt;', '&lt;PERIODICIDADE&gt;S&lt;');
    const fetchIndicator = (): Promise<unknown> => clientAnswering([], metadata).fetchIndicator('27574');

    await expect(fetchIndicator()).rejects.toThrow(ExternalSourceError);
    await expect(fetchIndicator()).rejects.toThrow(/'S'/);
  });

  it('should throw ExternalSourceError when the response has no series metadata', async () => {
    await expect(clientAnswering([], '<soapenv:Envelope></soapenv:Envelope>').fetchIndicator('27574')).rejects.toThrow(ExternalSourceError);
  });
});

describe('BcbSgsClient.fetchObservations', () => {
  it('should return every observation with the exact decimal text published by the SGS when the period has data', async () => {
    const client = new BcbSgsClient(new RecordedSgsHttpClient({ periods: ['2026-06-01-to-2026-09-24'] }));

    await expect(client.fetchObservations('27574', JUNE_1, SEP_24)).resolves.toEqual([
      { date: CalendarDate.fromIso('2026-06-01'), value: '442.88' },
      { date: CalendarDate.fromIso('2026-07-01'), value: '440.36' },
      { date: CalendarDate.fromIso('2026-08-01'), value: '456.24' },
    ]);
  });

  it('should query the series and the period in the SGS date format and accept the not found status', async () => {
    const http = new RecordedSgsHttpClient({ periods: ['2026-06-01-to-2026-09-24'] });

    await new BcbSgsClient(http, 'https://sgs.test/dados/serie', 'https://sgs.test/ws').fetchObservations('27574', JUNE_1, SEP_24);

    const url = new URL(http.requestedUrls[0] ?? '');
    expect(`${url.origin}${url.pathname}`).toBe('https://sgs.test/dados/serie/bcdata.sgs.27574/dados');
    expect(Object.fromEntries(url.searchParams)).toEqual({ formato: 'json', dataInicial: '01/06/2026', dataFinal: '24/09/2026' });
    expect(http.requestedOptions[0]).toEqual({ acceptedStatuses: [404] });
  });

  it('should return an empty list when the SGS answers that the period has no values', async () => {
    const client = new BcbSgsClient(new RecordedSgsHttpClient({ periods: ['2026-09-23-to-2026-09-24'] }));

    await expect(client.fetchObservations('27574', CalendarDate.fromIso('2026-09-23'), SEP_24)).resolves.toEqual([]);
  });

  it('should throw ExternalSourceError when the SGS answers an error other than values not found', async () => {
    const payload = { erro: { statusCode: 404, detail: 'Series not found' } };

    await expect(clientAnswering(payload).fetchObservations('27574', JUNE_1, SEP_24)).rejects.toThrow(ExternalSourceError);
  });

  it('should throw ExternalSourceError when a value is not a decimal number', async () => {
    const payload = [{ data: '01/06/2026', valor: '442,88' }];

    await expect(clientAnswering(payload).fetchObservations('27574', JUNE_1, SEP_24)).rejects.toThrow(ExternalSourceError);
  });
});
