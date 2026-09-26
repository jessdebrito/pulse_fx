import { AppError } from './app-error';

export class InvalidValueError extends AppError {
  readonly code = 'INVALID_VALUE';
}
