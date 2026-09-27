import { CurrenciesService, CurrencyNotFoundError } from '../../../../src/modules/currencies';
import { CalendarDate } from '../../../../src/shared/calendar-date';
import { InMemoryCurrencyQuoteRepository, InMemoryCurrencyRepository } from '../../../support/in-memory/currencies';
import { recordedCurrencies, recordedQuotes } from '../../../support/sources/bcb-ptax/recorded-data';

async function serviceWithRecordedData(): Promise<CurrenciesService> {
  const currencies = new InMemoryCurrencyRepository();
  const quotes = new InMemoryCurrencyQuoteRepository();
  await currencies.upsertMany(await recordedCurrencies('USD', 'JPY', 'EUR'));
  await quotes.upsertMany('USD', await recordedQuotes('USD', '2026-09-23-to-2026-09-24'));
  await quotes.upsertMany('EUR', await recordedQuotes('EUR', '2026-09-23-to-2026-09-24'));
  return new CurrenciesService({ currencies, quotes });
}

describe('CurrenciesService.listWithLatestQuote', () => {
  it('should list every currency ordered by code with its most recent bulletin when quotes exist', async () => {
    const service = await serviceWithRecordedData();

    const summaries = await service.listWithLatestQuote();

    expect(summaries.map((summary) => summary.code)).toEqual(['EUR', 'JPY', 'USD']);
    expect(summaries.find((summary) => summary.code === 'USD')).toEqual({
      code: 'USD',
      name: 'Dólar dos Estados Unidos',
      type: 'A',
      latestQuote: {
        quotedAt: '2026-09-24T13:03:18.656275-03:00',
        quoteDate: '2026-09-24',
        bulletin: 'closing',
        bid: 5.1789,
        ask: 5.1795,
        bidParity: 1,
        askParity: 1,
      },
      variation: null,
      trend: [
        { date: '2026-09-23', value: 5.1414 },
        { date: '2026-09-24', value: 5.1795 },
      ],
    });
  });

  it('should keep the currency with a null latest quote when it has no quotes yet', async () => {
    const service = await serviceWithRecordedData();

    const summaries = await service.listWithLatestQuote();

    expect(summaries.find((summary) => summary.code === 'JPY')).toEqual({ code: 'JPY', name: 'Iene', type: 'A', latestQuote: null, variation: null, trend: [] });
  });

  it('should compare the latest PTAX closing with the closing five business days before when the currency has enough closings', async () => {
    const currencies = new InMemoryCurrencyRepository();
    const quotes = new InMemoryCurrencyQuoteRepository();
    await currencies.upsertMany(await recordedCurrencies('USD'));
    await quotes.upsertMany('USD', await recordedQuotes('USD', '2026-09-01-to-2026-09-25'));

    const [usd] = await new CurrenciesService({ currencies, quotes }).listWithLatestQuote();

    expect(usd?.variation).toMatchObject({
      latestDate: '2026-09-25',
      latestValue: 5.1991,
      baseDate: '2026-09-18',
      baseValue: 5.1575,
      rule: { kind: 'observations', count: 5 },
    });
    expect(usd?.variation?.percent).toBeCloseTo(0.8066, 4);
  });

  it('should give as trend the closing of each day of the 90 days ending at the latest closing, oldest first', async () => {
    const currencies = new InMemoryCurrencyRepository();
    const quotes = new InMemoryCurrencyQuoteRepository();
    await currencies.upsertMany(await recordedCurrencies('USD'));
    await quotes.upsertMany('USD', await recordedQuotes('USD', '2025-12-30-to-2026-01-02'));
    await quotes.upsertMany('USD', await recordedQuotes('USD', '2026-09-01-to-2026-09-25'));

    const [usd] = await new CurrenciesService({ currencies, quotes }).listWithLatestQuote();

    expect(usd?.trend).toHaveLength(18);
    expect(usd?.trend.every((point) => point.date.startsWith('2026-09'))).toBe(true);
    expect([usd?.trend[0]?.date, usd?.trend.at(-1)]).toEqual(['2026-09-01', { date: '2026-09-25', value: 5.1991 }]);
  });

  it('should have no variation when the currency has fewer than six closings', async () => {
    const service = await serviceWithRecordedData();

    const summaries = await service.listWithLatestQuote();

    expect(summaries.map((summary) => [summary.code, summary.variation])).toEqual([
      ['EUR', null],
      ['JPY', null],
      ['USD', null],
    ]);
  });

  it('should return an empty list when the catalog is empty', async () => {
    const service = new CurrenciesService({ currencies: new InMemoryCurrencyRepository(), quotes: new InMemoryCurrencyQuoteRepository() });

    await expect(service.listWithLatestQuote()).resolves.toEqual([]);
  });
});

describe('CurrenciesService.getQuotes', () => {
  const START_OF_YEAR = CalendarDate.fromIso('2026-01-01');
  const TODAY = CalendarDate.fromIso('2026-09-25');

  it('should return every bulletin of the currency in chronological order when the period has quotes', async () => {
    const service = await serviceWithRecordedData();

    const history = await service.getQuotes('USD', START_OF_YEAR, TODAY);

    expect(history).toMatchObject({ code: 'USD', name: 'Dólar dos Estados Unidos', type: 'A', from: '2026-01-01', to: '2026-09-25' });
    expect(history.quotes.map((quote) => `${quote.quotedAt} ${quote.bulletin} ${quote.ask}`)).toEqual([
      '2026-09-23T10:09:12.049359-03:00 opening 5.1322',
      '2026-09-23T11:05:11.963001-03:00 intermediate 5.1388',
      '2026-09-23T12:09:11.058949-03:00 intermediate 5.1445',
      '2026-09-23T13:04:22.259409-03:00 intermediate 5.15',
      '2026-09-23T13:04:22.36175-03:00 closing 5.1414',
      '2026-09-24T10:05:12.142503-03:00 opening 5.1682',
      '2026-09-24T11:05:11.049556-03:00 intermediate 5.1716',
      '2026-09-24T12:02:15.561312-03:00 intermediate 5.183',
      '2026-09-24T13:03:18.602841-03:00 intermediate 5.1953',
      '2026-09-24T13:03:18.656275-03:00 closing 5.1795',
    ]);
  });

  it('should keep only the bulletins inside the period when the range is a single day', async () => {
    const service = await serviceWithRecordedData();
    const sep24 = CalendarDate.fromIso('2026-09-24');

    const history = await service.getQuotes('USD', sep24, sep24);

    expect(history.quotes).toHaveLength(5);
    expect(history.quotes.every((quote) => quote.quoteDate === '2026-09-24')).toBe(true);
  });

  it('should return an empty list when the currency has no bulletins in the period', async () => {
    const service = await serviceWithRecordedData();

    await expect(service.getQuotes('JPY', START_OF_YEAR, TODAY)).resolves.toMatchObject({ code: 'JPY', quotes: [] });
  });

  it('should throw CurrencyNotFoundError when the currency is not in the catalog', async () => {
    const service = await serviceWithRecordedData();

    await expect(service.getQuotes('XYZ', START_OF_YEAR, TODAY)).rejects.toThrow(CurrencyNotFoundError);
  });
});

describe('CurrenciesService.getAvailablePeriods', () => {
  it('should list the years with data from the most recent and the months with data of each year', async () => {
    const service = await serviceWithRecordedData();
    const usdAcrossTheYear = new InMemoryCurrencyQuoteRepository();
    const currencies = new InMemoryCurrencyRepository();
    await currencies.upsertMany(await recordedCurrencies('USD'));
    await usdAcrossTheYear.upsertMany('USD', await recordedQuotes('USD', '2025-12-30-to-2026-01-02'));
    await usdAcrossTheYear.upsertMany('USD', await recordedQuotes('USD', '2026-09-23-to-2026-09-24'));

    await expect(service.getAvailablePeriods('USD')).resolves.toEqual({ code: 'USD', periods: [{ year: 2026, months: [9] }] });
    await expect(new CurrenciesService({ currencies, quotes: usdAcrossTheYear }).getAvailablePeriods('USD')).resolves.toEqual({
      code: 'USD',
      periods: [
        { year: 2026, months: [1, 9] },
        { year: 2025, months: [12] },
      ],
    });
  });

  it('should return no periods when the currency has no quotes yet', async () => {
    const service = await serviceWithRecordedData();

    await expect(service.getAvailablePeriods('JPY')).resolves.toEqual({ code: 'JPY', periods: [] });
  });

  it('should throw CurrencyNotFoundError when the currency is not in the catalog', async () => {
    const service = await serviceWithRecordedData();

    await expect(service.getAvailablePeriods('XYZ')).rejects.toThrow(CurrencyNotFoundError);
  });
});
