import { z } from 'zod';
import { CalendarDate } from '../../../shared/calendar-date';
import { APP_UTC_OFFSET } from '../../../shared/clock';
import type { Bulletin, Currency, CurrencyQuote } from '../../currencies';
import { BCB_PTAX_BASE_URL } from '../sync.constants';
import { ExternalSourceError } from '../sync.errors';
import type { HttpClient } from './http-client';

export interface PtaxClient {
  fetchCurrencies(): Promise<Currency[]>;
  fetchQuotes(currencyCode: string, from: CalendarDate, to: CalendarDate): Promise<CurrencyQuote[]>;
}

const QUOTES_RESOURCE = 'CotacaoMoedaPeriodo(moeda=@moeda,dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)';
const QUOTE_FIELDS = 'paridadeCompra,paridadeVenda,cotacaoCompra,cotacaoVenda,dataHoraCotacao,tipoBoletim';
const OPENING_LABEL = 'Abertura';
const INTERMEDIATE_LABEL = 'Intermediário';
const CLOSING_LABEL_PREFIX = 'Fechamento';
const DATE_LENGTH = 10;
const TIME_START = 11;

const catalogSchema = z.object({
  value: z.array(
    z.object({
      simbolo: z.string().length(3),
      nomeFormatado: z.string().min(1),
      tipoMoeda: z.enum(['A', 'B']),
    }),
  ),
});

const quoteSchema = z.object({
  paridadeCompra: z.number(),
  paridadeVenda: z.number(),
  cotacaoCompra: z.number(),
  cotacaoVenda: z.number(),
  dataHoraCotacao: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?$/),
  tipoBoletim: z.string(),
});

const quotesSchema = z.object({ value: z.array(quoteSchema) });

type PtaxQuote = z.infer<typeof quoteSchema>;

export class BcbPtaxClient implements PtaxClient {
  constructor(
    private readonly http: HttpClient,
    private readonly baseUrl: string = BCB_PTAX_BASE_URL,
  ) {}

  async fetchCurrencies(): Promise<Currency[]> {
    const payload = await this.http.getJson(`${this.baseUrl}/Moedas?$format=json`);
    const catalog = parsePayload(catalogSchema, payload, 'currency catalog');
    return catalog.value.map((item) => ({ code: item.simbolo, name: item.nomeFormatado, type: item.tipoMoeda }));
  }

  async fetchQuotes(currencyCode: string, from: CalendarDate, to: CalendarDate): Promise<CurrencyQuote[]> {
    const payload = await this.http.getJson(this.quotesUrl(currencyCode, from, to));
    return parsePayload(quotesSchema, payload, `${currencyCode} quotes`).value.map(toCurrencyQuote);
  }

  private quotesUrl(currencyCode: string, from: CalendarDate, to: CalendarDate): string {
    const query = [
      `@moeda='${currencyCode}'`,
      `@dataInicial='${toBcbDate(from)}'`,
      `@dataFinalCotacao='${toBcbDate(to)}'`,
      '$format=json',
      `$select=${QUOTE_FIELDS}`,
    ].join('&');
    return `${this.baseUrl}/${QUOTES_RESOURCE}?${query}`;
  }
}

function parsePayload<T>(schema: z.ZodType<T>, payload: unknown, subject: string): T {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new ExternalSourceError(`Unexpected PTAX ${subject} payload: ${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

function toCurrencyQuote(quote: PtaxQuote): CurrencyQuote {
  const date = quote.dataHoraCotacao.slice(0, DATE_LENGTH);
  const time = quote.dataHoraCotacao.slice(TIME_START);
  return {
    quotedAt: `${date}T${time}${APP_UTC_OFFSET}`,
    quoteDate: CalendarDate.fromIso(date),
    bulletin: toBulletin(quote.tipoBoletim),
    bid: quote.cotacaoCompra,
    ask: quote.cotacaoVenda,
    bidParity: quote.paridadeCompra,
    askParity: quote.paridadeVenda,
  };
}

function toBulletin(label: string): Bulletin {
  if (label === OPENING_LABEL) return 'opening';
  if (label === INTERMEDIATE_LABEL) return 'intermediate';
  if (label.startsWith(CLOSING_LABEL_PREFIX)) return 'closing';
  throw new ExternalSourceError(`Unknown PTAX bulletin type '${label}'`);
}

function toBcbDate(date: CalendarDate): string {
  const [year, month, day] = date.toString().split('-');
  return `${month}-${day}-${year}`;
}
