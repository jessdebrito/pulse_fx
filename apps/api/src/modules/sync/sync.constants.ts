import type { IndicatorKey } from '../indicators';

export const INITIAL_LOAD_DAYS_BACK = 1;

export const SYNC_ADVISORY_LOCK_KEY = 7_300_001;

export const INDICATOR_SYNC_ADVISORY_LOCK_KEY = 7_300_002;

export const HTTP_CLIENT_OPTIONS = Object.freeze({
  timeoutMs: 10_000,
  maxAttempts: 3,
  retryDelayMs: 500,
});

export const BCB_PTAX_BASE_URL = 'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata';

export const FRED_BASE_URL = 'https://api.stlouisfed.org/fred';

export const BCB_SGS_BASE_URL = 'https://api.bcb.gov.br/dados/serie';

export const BCB_SGS_METADATA_URL = 'https://www3.bcb.gov.br/wssgs/services/FachadaWSSGS';

export const DECIMAL_TEXT_PATTERN = /^-?\d+(\.\d+)?$/;

export const TRACKED_INDICATORS: readonly IndicatorKey[] = Object.freeze([
  { source: 'fred', code: 'IMP3510' },
  { source: 'fred', code: 'EXP3510' },
  { source: 'fred', code: 'IMPCA' },
  { source: 'fred', code: 'EXPCA' },
  { source: 'fred', code: 'POILBREUSDM' },
  { source: 'fred', code: 'PNGASUSUSDM' },
  { source: 'fred', code: 'PIORECRUSDM' },
  { source: 'fred', code: 'WPU101' },
  { source: 'fred', code: 'PCOFFOTMUSDM' },
  { source: 'fred', code: 'PBEEFUSDM' },
  { source: 'fred', code: 'PORANGUSDM' },
  { source: 'fred', code: 'PSUGAISAUSDM' },
  { source: 'fred', code: 'PSOYBUSDM' },
  { source: 'fred', code: 'PFOODINDEXM' },
  { source: 'fred', code: 'PMETAINDEXM' },
  { source: 'fred', code: 'PNRGINDEXM' },
  { source: 'fred', code: 'B235RC1Q027SBEA' },
  { source: 'fred', code: 'EPUTRADE' },
  { source: 'sgs', code: '22707' },
  { source: 'sgs', code: '22708' },
  { source: 'sgs', code: '22709' },
  { source: 'sgs', code: '27574' },
  { source: 'sgs', code: '27575' },
  { source: 'sgs', code: '27576' },
  { source: 'sgs', code: '27577' },
]);
