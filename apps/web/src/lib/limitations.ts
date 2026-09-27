import type { IndicatorKey, IndicatorSource } from '../api/indicators';

const CURRENCY_LIMITATIONS: readonly string[] = [
  'A PTAX é publicada só em dias úteis: fins de semana e feriados ficam sem ponto no gráfico, sem interpolação.',
  'O gráfico e a variação usam o fechamento PTAX (venda); abertura e boletins intermediários não entram.',
  'Os dados são atualizados às 10:15 e às 13:15 em dias úteis; o fechamento do dia só aparece depois da atualização das 13:15.',
];

const SOURCE_LIMITATIONS: Readonly<Record<IndicatorSource, readonly string[]>> = {
  fred: [
    'As séries do FRED saem com atraso: o último ponto costuma ser de 1 a 2 meses atrás, e o das trimestrais, de mais tempo.',
    'O FRED pode revisar valores já publicados; o Pulse FX atualiza a partir do último mês gravado, e revisões mais antigas só entram numa nova importação do histórico.',
    'Nome e unidade são os publicados pela fonte, em inglês; valores em dólar não são convertidos para reais.',
  ],
  sgs: [
    'As séries do SGS (Banco Central) saem com atraso de semanas: o último ponto costuma ser do mês anterior ou de dois meses atrás.',
    'O Banco Central pode revisar valores já publicados; revisões mais antigas só entram numa nova importação do histórico.',
  ],
};

const SERIES_LIMITATION_GROUPS: readonly (readonly [string, readonly string[]])[] = [
  [
    'Dados do Census dos EUA sem ajuste sazonal: há meses naturalmente mais fortes ou mais fracos, e os números diferem das estatísticas oficiais do Brasil e do Canadá.',
    ['fred/IMP3510', 'fred/EXP3510', 'fred/IMPCA', 'fred/EXPCA'],
  ],
  [
    'Preços do FMI são médias mensais em dólar, não cotações diárias, e refletem o mercado internacional, não o preço recebido pelo produtor brasileiro.',
    [
      'fred/POILBREUSDM',
      'fred/PNGASUSUSDM',
      'fred/PIORECRUSDM',
      'fred/PCOFFOTMUSDM',
      'fred/PBEEFUSDM',
      'fred/PORANGUSDM',
      'fred/PSUGAISAUSDM',
      'fred/PSOYBUSDM',
      'fred/PFOODINDEXM',
      'fred/PMETAINDEXM',
      'fred/PNRGINDEXM',
    ],
  ],
  ['Índice de preços ao produtor dos EUA (1982 = 100): mede o preço do ferro e do aço nos EUA, não o do aço brasileiro exportado.', ['fred/WPU101']],
  [
    'Valor trimestral em taxa anual com ajuste sazonal: cada ponto mostra quanto os EUA arrecadariam em um ano no ritmo daquele trimestre.',
    ['fred/B235RC1Q027SBEA'],
  ],
  [
    'Índice calculado a partir de notícias de jornais dos EUA: mede a incerteza percebida sobre a política comercial, não as tarifas em vigor.',
    ['fred/EPUTRADE'],
  ],
  [
    'Balança comercial no conceito do balanço de pagamentos (Banco Central), em US$ milhões; difere dos números divulgados pela Secex/MDIC.',
    ['sgs/22707', 'sgs/22708', 'sgs/22709'],
  ],
  ['O IC-Br é medido em reais: sobe tanto com o preço das commodities quanto com a alta do dólar.', ['sgs/27574', 'sgs/27575', 'sgs/27576', 'sgs/27577']],
];

const SERIES_LIMITATIONS: ReadonlyMap<string, string> = new Map(SERIES_LIMITATION_GROUPS.flatMap(([text, ids]) => ids.map((id) => [id, text] as const)));

export function currencyLimitations(): string[] {
  return [...CURRENCY_LIMITATIONS];
}

export function indicatorLimitations(indicator: IndicatorKey): string[] {
  const specific = SERIES_LIMITATIONS.get(`${indicator.source}/${indicator.code}`);
  return specific === undefined ? [...SOURCE_LIMITATIONS[indicator.source]] : [...SOURCE_LIMITATIONS[indicator.source], specific];
}
