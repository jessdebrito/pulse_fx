import { indicatorId } from '../../../../src/modules/indicators';

describe('indicatorId', () => {
  it('should join the source and the code when identifying an indicator', () => {
    expect(indicatorId({ source: 'fred', code: 'IMP3510' })).toBe('fred/IMP3510');
    expect(indicatorId({ source: 'sgs', code: '27574' })).toBe('sgs/27574');
  });
});
