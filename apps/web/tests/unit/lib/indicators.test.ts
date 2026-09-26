import { displayNameOf, groupByTheme, indicatorLabel } from '../../../src/lib/indicators';
import { recordedIndicator, recordedIndicatorSummaries } from '../../support/api/recorded-indicators';

describe('indicatorLabel', () => {
  it.each([
    ['fred', 'IMP3510', 'Importações dos EUA vindas do Brasil'],
    ['fred', 'B235RC1Q027SBEA', 'Tarifas de importação arrecadadas pelos EUA'],
    ['sgs', '27574', 'Índice de Commodities Brasil (IC-Br)'],
  ] as const)('should name %s/%s in Portuguese as %p', (source, code, label) => {
    expect(indicatorLabel({ source, code })).toBe(label);
  });

  it('should have a Portuguese name for every indicator the API serves', () => {
    expect(recordedIndicatorSummaries().filter((indicator) => indicatorLabel(indicator) === null)).toEqual([]);
  });

  it('should return null when the indicator has no Portuguese name', () => {
    expect(indicatorLabel({ source: 'fred', code: 'UNKNOWN' })).toBeNull();
  });
});

describe('displayNameOf', () => {
  it('should prefer the Portuguese name when there is one', () => {
    expect(displayNameOf(recordedIndicator('fred', 'EPUTRADE'))).toBe('Incerteza da política comercial dos EUA');
  });

  it('should fall back to the name published by the source when there is no Portuguese name', () => {
    expect(displayNameOf({ ...recordedIndicator('fred', 'EPUTRADE'), code: 'UNKNOWN' })).toBe('Economic Policy Uncertainty Index: Categorical Index: Trade policy');
  });
});

describe('groupByTheme', () => {
  const codesOf = (theme: { readonly indicators: readonly { readonly code: string }[] } | undefined): string[] => (theme?.indicators ?? []).map((indicator) => indicator.code);

  it('should group the indicators by theme in the display order', () => {
    const themes = groupByTheme(recordedIndicatorSummaries());

    expect(themes.map((theme) => theme.title)).toEqual(['Comércio EUA', 'Tarifas', 'Energia', 'Metais', 'Agro', 'Brasil']);
    expect(codesOf(themes[0])).toEqual(['IMP3510', 'EXP3510', 'IMPCA', 'EXPCA']);
    expect(codesOf(themes[1])).toEqual(['B235RC1Q027SBEA', 'EPUTRADE']);
    expect(codesOf(themes[5])).toEqual(['22707', '22708', '22709', '27574', '27575', '27576', '27577']);
    expect(themes.flatMap((theme) => theme.indicators)).toHaveLength(25);
  });

  it('should put indicators without a theme in a last group named Outros', () => {
    const unknown = { ...recordedIndicator('sgs', '27574'), code: '99999' };

    const themes = groupByTheme([recordedIndicator('sgs', '27574'), unknown]);

    expect(themes.map((theme) => [theme.title, codesOf(theme)])).toEqual([
      ['Brasil', ['27574']],
      ['Outros', ['99999']],
    ]);
  });

  it('should return no groups when there are no indicators', () => {
    expect(groupByTheme([])).toEqual([]);
  });
});
