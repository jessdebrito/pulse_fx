import type { FetchFunction } from '../../../src/api/http';
import { fetchIndicatorObservations, fetchIndicatorPeriods, fetchIndicators } from '../../../src/api/indicators';
import { jsonResponse } from '../../support/api/recorded-currencies';
import {
  recordedIndicatorSummaries,
  recordedIndicatorsResponse,
  recordedUsImportsFromBrazilObservations,
  recordedUsImportsFromBrazilObservationsResponse,
  recordedUsImportsFromBrazilPeriods,
  recordedUsImportsFromBrazilPeriodsResponse,
} from '../../support/api/recorded-indicators';

const US_IMPORTS_FROM_BRAZIL = { source: 'fred', code: 'IMP3510' } as const;

function fetchAnswering(body: unknown, status = 200): jest.Mock<ReturnType<FetchFunction>, Parameters<FetchFunction>> {
  return jest.fn<ReturnType<FetchFunction>, Parameters<FetchFunction>>().mockResolvedValue(jsonResponse(body, status));
}

describe('fetchIndicators', () => {
  it('should request the indicators route and return the parsed indicators when the API answers 200', async () => {
    const fetchFunction = fetchAnswering(recordedIndicatorsResponse());

    const indicators = await fetchIndicators(fetchFunction);

    expect(fetchFunction).toHaveBeenCalledWith('/api/indicators');
    expect(indicators).toEqual(recordedIndicatorSummaries());
    expect(indicators).toHaveLength(25);
  });

  it('should throw naming the status when the API responds with an error', async () => {
    await expect(fetchIndicators(fetchAnswering({ error: { code: 'INTERNAL_ERROR' } }, 500))).rejects.toThrow(/HTTP 500/);
  });

  it('should throw when the payload does not match the expected format', async () => {
    await expect(fetchIndicators(fetchAnswering([{ source: 'ibge', code: '1' }]))).rejects.toThrow();
  });
});

describe('fetchIndicatorObservations', () => {
  const HISTORY = { from: '2024-01-01', to: '2026-07-31' };

  it('should request the observations of the indicator for the period and return them parsed', async () => {
    const fetchFunction = fetchAnswering(recordedUsImportsFromBrazilObservationsResponse());

    await expect(fetchIndicatorObservations(US_IMPORTS_FROM_BRAZIL, HISTORY, fetchFunction)).resolves.toEqual(recordedUsImportsFromBrazilObservations());
    expect(fetchFunction).toHaveBeenCalledWith('/api/indicators/fred/IMP3510/observations?from=2024-01-01&to=2026-07-31');
  });

  it('should throw naming the status when the indicator is not in the catalog', async () => {
    await expect(fetchIndicatorObservations({ source: 'sgs', code: '99999' }, HISTORY, fetchAnswering({ error: { code: 'INDICATOR_NOT_FOUND' } }, 404))).rejects.toThrow(/HTTP 404/);
  });
});

describe('fetchIndicatorPeriods', () => {
  it('should request the periods route of the indicator and return the parsed periods when the API answers 200', async () => {
    const fetchFunction = fetchAnswering(recordedUsImportsFromBrazilPeriodsResponse());

    await expect(fetchIndicatorPeriods(US_IMPORTS_FROM_BRAZIL, fetchFunction)).resolves.toEqual(recordedUsImportsFromBrazilPeriods());
    expect(fetchFunction).toHaveBeenCalledWith('/api/indicators/fred/IMP3510/periods');
  });
});
