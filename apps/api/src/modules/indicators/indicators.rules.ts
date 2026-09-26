import type { IndicatorKey } from './indicators.types';

export function indicatorId(key: IndicatorKey): string {
  return `${key.source}/${key.code}`;
}
