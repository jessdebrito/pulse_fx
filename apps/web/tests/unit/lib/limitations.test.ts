import { currencyLimitations, indicatorLimitations } from '../../../src/lib/limitations';

const PTAX_BUSINESS_DAYS = 'A PTAX é publicada só em dias úteis: fins de semana e feriados ficam sem ponto no gráfico, sem interpolação.';
const PTAX_CLOSING_ONLY = 'O gráfico e a variação usam o fechamento PTAX (venda); abertura e boletins intermediários não entram.';
const PTAX_SCHEDULE = 'Os dados são atualizados às 10:15 e às 13:15 em dias úteis; o fechamento do dia só aparece depois da atualização das 13:15.';
const FRED_DELAY = 'As séries do FRED saem com atraso: o último ponto costuma ser de 1 a 2 meses atrás, e o das trimestrais, de mais tempo.';
const FRED_REVISIONS = 'O FRED pode revisar valores já publicados; o Pulse FX atualiza a partir do último mês gravado, e revisões mais antigas só entram numa nova importação do histórico.';
const FRED_SOURCE_TEXT = 'Nome e unidade são os publicados pela fonte, em inglês; valores em dólar não são convertidos para reais.';
const SGS_DELAY = 'As séries do SGS (Banco Central) saem com atraso de semanas: o último ponto costuma ser do mês anterior ou de dois meses atrás.';
const SGS_REVISIONS = 'O Banco Central pode revisar valores já publicados; revisões mais antigas só entram numa nova importação do histórico.';

describe('currencyLimitations', () => {
  it('should explain the business days, the closing bulletin and the update schedule of the PTAX', () => {
    expect(currencyLimitations()).toEqual([PTAX_BUSINESS_DAYS, PTAX_CLOSING_ONLY, PTAX_SCHEDULE]);
  });
});

describe('indicatorLimitations', () => {
  it('should explain the delay, the revisions and the source texts of every FRED series', () => {
    expect(indicatorLimitations({ source: 'fred', code: 'UNKNOWN' })).toEqual([FRED_DELAY, FRED_REVISIONS, FRED_SOURCE_TEXT]);
  });

  it('should explain the delay and the revisions of every SGS series', () => {
    expect(indicatorLimitations({ source: 'sgs', code: '99999' })).toEqual([SGS_DELAY, SGS_REVISIONS]);
  });

  it.each([
    ['fred', 'IMP3510', 'Dados do Census dos EUA sem ajuste sazonal: há meses naturalmente mais fortes ou mais fracos, e os números diferem das estatísticas oficiais do Brasil e do Canadá.'],
    ['fred', 'EXPCA', 'Dados do Census dos EUA sem ajuste sazonal: há meses naturalmente mais fortes ou mais fracos, e os números diferem das estatísticas oficiais do Brasil e do Canadá.'],
    ['fred', 'PCOFFOTMUSDM', 'Preços do FMI são médias mensais em dólar, não cotações diárias, e refletem o mercado internacional, não o preço recebido pelo produtor brasileiro.'],
    ['fred', 'PNRGINDEXM', 'Preços do FMI são médias mensais em dólar, não cotações diárias, e refletem o mercado internacional, não o preço recebido pelo produtor brasileiro.'],
    ['fred', 'WPU101', 'Índice de preços ao produtor dos EUA (1982 = 100): mede o preço do ferro e do aço nos EUA, não o do aço brasileiro exportado.'],
    ['fred', 'B235RC1Q027SBEA', 'Valor trimestral em taxa anual com ajuste sazonal: cada ponto mostra quanto os EUA arrecadariam em um ano no ritmo daquele trimestre.'],
    ['fred', 'EPUTRADE', 'Índice calculado a partir de notícias de jornais dos EUA: mede a incerteza percebida sobre a política comercial, não as tarifas em vigor.'],
    ['sgs', '22708', 'Balança comercial no conceito do balanço de pagamentos (Banco Central), em US$ milhões; difere dos números divulgados pela Secex/MDIC.'],
    ['sgs', '27576', 'O IC-Br é medido em reais: sobe tanto com o preço das commodities quanto com a alta do dólar.'],
  ] as const)('should add the specific limitation of %s/%s after the source limitations', (source, code, specific) => {
    const limitations = indicatorLimitations({ source, code });

    expect(limitations.at(-1)).toBe(specific);
    expect(limitations).toContain(source === 'fred' ? FRED_DELAY : SGS_DELAY);
  });
});
