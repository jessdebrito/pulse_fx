import { indicatorId, variationRuleOf } from '../../../../src/modules/indicators';

describe('indicatorId', () => {
  it('should join the source and the code when identifying an indicator', () => {
    expect(indicatorId({ source: 'fred', code: 'IMP3510' })).toBe('fred/IMP3510');
    expect(indicatorId({ source: 'sgs', code: '27574' })).toBe('sgs/27574');
  });
});

describe('variationRuleOf', () => {
  it.each([
    ['daily', { kind: 'observations', count: 5 }],
    ['weekly', { kind: 'observations', count: 4 }],
    ['monthly', { kind: 'months', count: 12 }],
    ['quarterly', { kind: 'months', count: 12 }],
    ['annual', { kind: 'months', count: 12 }],
  ] as const)('should compare a %s series using %p', (frequency, rule) => {
    expect(variationRuleOf(frequency)).toEqual(rule);
  });
});
