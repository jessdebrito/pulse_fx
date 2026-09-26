import { AppError } from '../../shared/errors/app-error';

export class SyncInProgressError extends AppError {
  readonly code = 'SYNC_IN_PROGRESS';

  constructor() {
    super('A sync is already in progress');
  }
}

export class ExternalSourceError extends AppError {
  readonly code = 'EXTERNAL_SOURCE_ERROR';
}
