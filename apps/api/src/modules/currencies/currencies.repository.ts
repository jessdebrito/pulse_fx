import type { Database } from '../../database/client';
import type { Currency } from './currencies.types';

export interface CurrencyRepository {
  findAll(): Promise<Currency[]>;
  findByCode(code: string): Promise<Currency | null>;
  upsertMany(currencies: readonly Currency[]): Promise<number>;
}

export class PrismaCurrencyRepository implements CurrencyRepository {
  constructor(private readonly prisma: Database) {}

  findAll(): Promise<Currency[]> {
    return this.prisma.currency.findMany({ select: { code: true, name: true, type: true }, orderBy: { code: 'asc' } });
  }

  findByCode(code: string): Promise<Currency | null> {
    return this.prisma.currency.findUnique({ where: { code }, select: { code: true, name: true, type: true } });
  }

  async upsertMany(currencies: readonly Currency[]): Promise<number> {
    if (currencies.length === 0) return 0;
    await this.prisma.$transaction(
      currencies.map((currency) =>
        this.prisma.currency.upsert({
          where: { code: currency.code },
          create: { ...currency },
          update: { name: currency.name, type: currency.type },
        }),
      ),
    );
    return currencies.length;
  }
}
