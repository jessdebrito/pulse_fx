import { AppError } from '../../shared/errors/app-error';
import type { IndicatorKey } from './indicators.types';

export class IndicatorNotFoundError extends AppError {
  readonly code = 'INDICATOR_NOT_FOUND';

  constructor(key: IndicatorKey) {
    super(`Indicator ${key.source}/${key.code} is not in the catalog`);
  }
}
