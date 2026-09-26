import type { IndicatorKey, IndicatorSummary } from '../api/indicators';

export interface IndicatorTheme {
  readonly title: string;
  readonly indicators: readonly IndicatorSummary[];
}

interface ThemeDefinition {
  readonly title: string;
  readonly labels: Readonly<Record<string, string>>;
}

const OTHER_THEME_TITLE = 'Outros';

const THEMES: readonly ThemeDefinition[] = [
  {
    title: 'Comércio EUA',
    labels: {
      'fred/IMP3510': 'Importações dos EUA vindas do Brasil',
      'fred/EXP3510': 'Exportações dos EUA para o Brasil',
      'fred/IMPCA': 'Importações dos EUA vindas do Canadá',
      'fred/EXPCA': 'Exportações dos EUA para o Canadá',
    },
  },
  {
    title: 'Tarifas',
    labels: {
      'fred/B235RC1Q027SBEA': 'Tarifas de importação arrecadadas pelos EUA',
      'fred/EPUTRADE': 'Incerteza da política comercial dos EUA',
    },
  },
  {
    title: 'Energia',
    labels: {
      'fred/POILBREUSDM': 'Petróleo Brent',
      'fred/PNGASUSUSDM': 'Gás natural (Henry Hub, EUA)',
      'fred/PNRGINDEXM': 'Índice global de preços de energia',
    },
  },
  {
    title: 'Metais',
    labels: {
      'fred/PIORECRUSDM': 'Minério de ferro',
      'fred/WPU101': 'Preço ao produtor de ferro e aço nos EUA',
      'fred/PMETAINDEXM': 'Índice global de preços de metais',
    },
  },
  {
    title: 'Agro',
    labels: {
      'fred/PCOFFOTMUSDM': 'Café arábica',
      'fred/PBEEFUSDM': 'Carne bovina',
      'fred/PORANGUSDM': 'Laranja',
      'fred/PSUGAISAUSDM': 'Açúcar',
      'fred/PSOYBUSDM': 'Soja',
      'fred/PFOODINDEXM': 'Índice global de preços de alimentos',
    },
  },
  {
    title: 'Brasil',
    labels: {
      'sgs/22707': 'Saldo da balança comercial do Brasil',
      'sgs/22708': 'Exportações de bens do Brasil',
      'sgs/22709': 'Importações de bens do Brasil',
      'sgs/27574': 'Índice de Commodities Brasil (IC-Br)',
      'sgs/27575': 'IC-Br Agropecuária',
      'sgs/27576': 'IC-Br Metal',
      'sgs/27577': 'IC-Br Energia',
    },
  },
];

export function indicatorLabel(key: IndicatorKey): string | null {
  const id = idOf(key);
  return THEMES.find((theme) => id in theme.labels)?.labels[id] ?? null;
}

export function displayNameOf(indicator: IndicatorSummary): string {
  return indicatorLabel(indicator) ?? indicator.name;
}

export function groupByTheme(indicators: readonly IndicatorSummary[]): IndicatorTheme[] {
  const byId = new Map(indicators.map((indicator) => [idOf(indicator), indicator]));
  const themed = THEMES.map((theme) => ({ title: theme.title, indicators: Object.keys(theme.labels).flatMap((id) => byId.get(id) ?? []) }));
  const others = indicators.filter((indicator) => indicatorLabel(indicator) === null);
  return [...themed, { title: OTHER_THEME_TITLE, indicators: others }].filter((theme) => theme.indicators.length > 0);
}

function idOf(key: IndicatorKey): string {
  return `${key.source}/${key.code}`;
}
