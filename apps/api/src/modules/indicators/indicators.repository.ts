import type { Database } from '../../database/client';
import type { Indicator, IndicatorKey } from './indicators.types';

export interface IndicatorRepository {
  findAll(): Promise<Indicator[]>;
  findByKey(key: IndicatorKey): Promise<Indicator | null>;
  upsert(indicator: Indicator): Promise<void>;
}

const INDICATOR_FIELDS = Object.freeze({ source: true, code: true, name: true, unit: true, frequency: true });

export class PrismaIndicatorRepository implements IndicatorRepository {
  constructor(private readonly prisma: Database) {}

  findAll(): Promise<Indicator[]> {
    return this.prisma.indicator.findMany({ select: INDICATOR_FIELDS, orderBy: [{ source: 'asc' }, { code: 'asc' }] });
  }

  findByKey(key: IndicatorKey): Promise<Indicator | null> {
    return this.prisma.indicator.findUnique({ where: { source_code: { source: key.source, code: key.code } }, select: INDICATOR_FIELDS });
  }

  async upsert(indicator: Indicator): Promise<void> {
    const details = { name: indicator.name, unit: indicator.unit, frequency: indicator.frequency };
    await this.prisma.indicator.upsert({
      where: { source_code: { source: indicator.source, code: indicator.code } },
      create: { source: indicator.source, code: indicator.code, ...details },
      update: details,
    });
  }
}
