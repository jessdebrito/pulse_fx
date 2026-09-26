export const INITIAL_LOAD_DAYS_BACK = 1;

export const SYNC_ADVISORY_LOCK_KEY = 7_300_001;

export const HTTP_CLIENT_OPTIONS = Object.freeze({
  timeoutMs: 10_000,
  maxAttempts: 3,
  retryDelayMs: 500,
});

export const BCB_PTAX_BASE_URL = 'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata';
