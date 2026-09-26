import type { Database } from '../../database/client';
import { Prisma } from '../../generated/prisma/client';
import { CalendarDate } from '../../shared/calendar-date';
import { APP_TIME_ZONE, APP_UTC_OFFSET } from '../../shared/clock';
import type { AvailablePeriod, Bulletin, CurrencyQuote } from './currencies.types';

export interface CurrencyQuoteRepository {
  upsertMany(currencyCode: string, quotes: readonly CurrencyQuote[]): Promise<number>;
  hasAny(): Promise<boolean>;
  findLatestPerCurrency(): Promise<ReadonlyMap<string, CurrencyQuote>>;
  findByCurrencyBetween(currencyCode: string, from: CalendarDate, to: CalendarDate): Promise<CurrencyQuote[]>;
  findAvailablePeriods(currencyCode: string): Promise<AvailablePeriod[]>;
}

interface QuoteRow {
  readonly currencyCode: string;
  readonly localTime: string;
  readonly quoteDate: string;
  readonly bulletin: Bulletin;
  readonly bid: number;
  readonly ask: number;
  readonly bidParity: number;
  readonly askParity: number;
}

const QUOTE_COLUMNS = Prisma.sql`
  currency_code as "currencyCode",
  to_char(quoted_at at time zone ${APP_TIME_ZONE}, 'YYYY-MM-DD"T"HH24:MI:SS.US') as "localTime",
  quote_date::text as "quoteDate",
  bulletin::text as bulletin,
  bid::float8 as bid,
  ask::float8 as ask,
  bid_parity::float8 as "bidParity",
  ask_parity::float8 as "askParity"`;

export class PrismaCurrencyQuoteRepository implements CurrencyQuoteRepository {
  constructor(private readonly prisma: Database) {}

  async upsertMany(currencyCode: string, quotes: readonly CurrencyQuote[]): Promise<number> {
    if (quotes.length === 0) return 0;
    await this.prisma.$transaction(quotes.map((quote) => this.upsertQuote(currencyCode, quote)));
    return quotes.length;
  }

  async hasAny(): Promise<boolean> {
    const first = await this.prisma.currencyQuote.findFirst({ select: { currencyCode: true } });
    return first !== null;
  }

  async findLatestPerCurrency(): Promise<ReadonlyMap<string, CurrencyQuote>> {
    const rows = await this.prisma.$queryRaw<QuoteRow[]>`
      select distinct on (currency_code) ${QUOTE_COLUMNS}
      from currency_quotes
      order by currency_code, quoted_at desc`;
    return new Map(rows.map((row) => [row.currencyCode, toCurrencyQuote(row)]));
  }

  async findByCurrencyBetween(currencyCode: string, from: CalendarDate, to: CalendarDate): Promise<CurrencyQuote[]> {
    const rows = await this.prisma.$queryRaw<QuoteRow[]>`
      select ${QUOTE_COLUMNS}
      from currency_quotes
      where currency_code = ${currencyCode}
        and quote_date between ${from.toString()}::date and ${to.toString()}::date
      order by quoted_at`;
    return rows.map(toCurrencyQuote);
  }

  findAvailablePeriods(currencyCode: string): Promise<AvailablePeriod[]> {
    return this.prisma.$queryRaw<AvailablePeriod[]>`
      select
        extract(year from quote_date)::int as year,
        array_agg(distinct extract(month from quote_date)::int order by extract(month from quote_date)::int) as months
      from currency_quotes
      where currency_code = ${currencyCode}
      group by 1
      order by 1 desc`;
  }

  private upsertQuote(currencyCode: string, quote: CurrencyQuote): ReturnType<Database['$executeRaw']> {
    return this.prisma.$executeRaw`
      insert into currency_quotes (currency_code, quoted_at, bulletin, quote_date, bid, ask, bid_parity, ask_parity)
      values (
        ${currencyCode}, ${quote.quotedAt}::timestamptz, ${quote.bulletin}::bulletin, ${quote.quoteDate.toString()}::date,
        ${quote.bid}::numeric, ${quote.ask}::numeric, ${quote.bidParity}::numeric, ${quote.askParity}::numeric
      )
      on conflict (currency_code, quoted_at, bulletin) do update set
        quote_date = excluded.quote_date,
        bid = excluded.bid,
        ask = excluded.ask,
        bid_parity = excluded.bid_parity,
        ask_parity = excluded.ask_parity,
        fetched_at = now()`;
  }
}

function toCurrencyQuote(row: QuoteRow): CurrencyQuote {
  return {
    quotedAt: `${row.localTime}${APP_UTC_OFFSET}`,
    quoteDate: CalendarDate.fromIso(row.quoteDate),
    bulletin: row.bulletin,
    bid: row.bid,
    ask: row.ask,
    bidParity: row.bidParity,
    askParity: row.askParity,
  };
}
