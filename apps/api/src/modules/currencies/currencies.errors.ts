import { AppError } from '../../shared/errors/app-error';

export class CurrencyNotFoundError extends AppError {
  readonly code = 'CURRENCY_NOT_FOUND';

  constructor(currencyCode: string) {
    super(`Currency ${currencyCode} is not in the catalog`);
  }
}
