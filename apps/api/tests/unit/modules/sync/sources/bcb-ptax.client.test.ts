import { CalendarDate } from '../../../../../src/shared/calendar-date';
import { BcbPtaxClient } from '../../../../../src/modules/sync/sources/bcb-ptax.client';
import type { HttpClient } from '../../../../../src/modules/sync/sources/http-client';
import { ExternalSourceError } from '../../../../../src/modules/sync/sync.errors';
import { RecordedPtaxHttpClient } from '../../../../support/sources/bcb-ptax/recorded-ptax-http-client';

const SEP_23 = CalendarDate.fromIso('2026-09-23');
const SEP_24 = CalendarDate.fromIso('2026-09-24');

function clientReturning(payload: unknown): BcbPtaxClient {
  const http: HttpClient = { getJson: () => Promise.resolve(payload), postText: jest.fn() };
  return new BcbPtaxClient(http);
}

describe('BcbPtaxClient.fetchCurrencies', () => {
  it('should return every currency with its official name and type when the BCB answers the catalog', async () => {
    const client = new BcbPtaxClient(new RecordedPtaxHttpClient({ catalog: true }));

    const currencies = await client.fetchCurrencies();

    expect(currencies.map((currency) => currency.code)).toEqual(['AUD', 'CAD', 'CHF', 'DKK', 'EUR', 'GBP', 'JPY', 'NOK', 'SEK', 'USD']);
    expect(currencies).toContainEqual({ code: 'USD', name: 'Dólar dos Estados Unidos', type: 'A' });
    expect(currencies).toContainEqual({ code: 'EUR', name: 'Euro', type: 'B' });
  });

  it('should request the Moedas resource in JSON when fetching the catalog', async () => {
    const http = new RecordedPtaxHttpClient({ catalog: true });

    await new BcbPtaxClient(http, 'https://bcb.test/odata').fetchCurrencies();

    expect(http.requestedUrls).toEqual(['https://bcb.test/odata/Moedas?$format=json']);
  });

  it('should throw ExternalSourceError when the catalog does not match the BCB format', async () => {
    await expect(clientReturning({ value: [{ simbolo: 'USD' }] }).fetchCurrencies()).rejects.toThrow(ExternalSourceError);
  });
});

describe('BcbPtaxClient.fetchQuotes', () => {
  it('should return every bulletin including the intermediate ones when the period has quotes', async () => {
    const client = new BcbPtaxClient(new RecordedPtaxHttpClient({ periods: ['2026-09-23-to-2026-09-24'] }));

    const quotes = await client.fetchQuotes('USD', SEP_23, SEP_24);

    expect(quotes.map((quote) => `${quote.quoteDate.toString()} ${quote.bulletin} ${quote.ask}`)).toEqual([
      '2026-09-23 opening 5.1322',
      '2026-09-23 intermediate 5.1388',
      '2026-09-23 intermediate 5.1445',
      '2026-09-23 intermediate 5.15',
      '2026-09-23 closing 5.1414',
      '2026-09-24 opening 5.1682',
      '2026-09-24 intermediate 5.1716',
      '2026-09-24 intermediate 5.183',
      '2026-09-24 intermediate 5.1953',
      '2026-09-24 closing 5.1795',
    ]);
  });

  it('should keep bid, ask, both parities and the exact Brasilia quote time when mapping a bulletin', async () => {
    const client = new BcbPtaxClient(new RecordedPtaxHttpClient({ periods: ['2026-09-23-to-2026-09-24'] }));

    const quotes = await client.fetchQuotes('GBP', SEP_23, SEP_24);

    expect(quotes.at(-1)).toEqual({
      quotedAt: '2026-09-24T13:03:18.656275-03:00',
      quoteDate: SEP_24,
      bulletin: 'closing',
      bid: 6.8434,
      ask: 6.8457,
      bidParity: 1.3214,
      askParity: 1.3217,
    });
  });

  it('should query the currency and period in the BCB date format when fetching quotes', async () => {
    const http = new RecordedPtaxHttpClient({ periods: ['2026-09-23-to-2026-09-24'] });

    await new BcbPtaxClient(http, 'https://bcb.test/odata').fetchQuotes('USD', SEP_23, SEP_24);

    const url = http.requestedUrls[0] ?? '';
    expect(url.startsWith('https://bcb.test/odata/CotacaoMoedaPeriodo(moeda=@moeda,dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)?')).toBe(true);
    expect(url).toContain("@moeda='USD'");
    expect(url).toContain("@dataInicial='09-23-2026'");
    expect(url).toContain("@dataFinalCotacao='09-24-2026'");
    expect(url).toContain('$format=json');
  });

  it('should return an empty list when the period has no quotes', async () => {
    const client = new BcbPtaxClient(new RecordedPtaxHttpClient({ periods: ['2026-09-19-to-2026-09-20'] }));

    await expect(client.fetchQuotes('USD', CalendarDate.fromIso('2026-09-19'), CalendarDate.fromIso('2026-09-20'))).resolves.toEqual([]);
  });

  it('should treat the bulletin as closing when its label starts with Fechamento', async () => {
    const payload = { value: [{ paridadeCompra: 1.3214, paridadeVenda: 1.3217, cotacaoCompra: 6.8434, cotacaoVenda: 6.8457, dataHoraCotacao: '2026-09-24 13:03:18.656275', tipoBoletim: 'Fechamento PTAX' }] };

    const quotes = await clientReturning(payload).fetchQuotes('GBP', SEP_24, SEP_24);

    expect(quotes[0]?.bulletin).toBe('closing');
  });

  it('should throw ExternalSourceError naming the label when the bulletin type is unknown', async () => {
    const payload = { value: [{ paridadeCompra: 1, paridadeVenda: 1, cotacaoCompra: 5.1, cotacaoVenda: 5.2, dataHoraCotacao: '2026-09-24 14:00:00.000000', tipoBoletim: 'Extraordinário' }] };
    const fetchQuotes = (): Promise<unknown> => clientReturning(payload).fetchQuotes('USD', SEP_24, SEP_24);

    await expect(fetchQuotes()).rejects.toThrow(ExternalSourceError);
    await expect(fetchQuotes()).rejects.toThrow(/Extraordinário/);
  });

  it('should throw ExternalSourceError when the payload does not match the PTAX format', async () => {
    const payload = { value: [{ cotacaoVenda: 'not-a-number', dataHoraCotacao: '2026-09-24 13:03:18', tipoBoletim: 'Fechamento' }] };

    await expect(clientReturning(payload).fetchQuotes('USD', SEP_24, SEP_24)).rejects.toThrow(ExternalSourceError);
  });
});
