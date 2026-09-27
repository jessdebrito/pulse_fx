import type { IndicatorKey } from '../api/indicators';

const CURRENCY_REASONS: Readonly<Record<string, string>> = {
  USD: 'A PTAX do dólar é a taxa de referência oficial do BCB, usada em contratos, balanços e na liquidação de derivativos cambiais. É o "preço do dólar" que aparece em extratos e notícias, e a moeda em que se fatura a maior parte do comércio exterior brasileiro, inclusive o comércio com os EUA que o Pulse FX acompanha.',
  EUR: 'Moeda da União Europeia, um dos maiores parceiros comerciais do Brasil e destino frequente de viagem. Ver o euro ao lado do dólar separa "real fraco" (o real cai contra os dois) de "dólar forte no mundo" (o real cai só contra o dólar).',
  CAD: 'O Canadá também foi alvo das tarifas americanas em 2025 e, como o Brasil, exporta commodities. Se o real cai contra o dólar americano mas fica estável contra o canadense, o movimento é comum aos dois exportadores; se cai também contra o canadense, a causa é brasileira. Faz par com as séries de comércio EUA–Canadá.',
  AUD: 'Austrália e Brasil são os dois maiores exportadores de minério de ferro do mundo, e o dólar australiano reage ao preço das commodities e à demanda da China. Comparar o real com ele, e com a série de minério, mostra se o câmbio está acompanhando o ciclo das commodities.',
  NOK: 'A Noruega é grande exportadora de petróleo e gás, e a coroa costuma acompanhar o Brent. Como petróleo é o principal item que o Brasil vende aos EUA, a coroa ajuda a ver quanto do movimento do real vem do petróleo.',
  CHF: 'Moeda de refúgio: em crises globais o franco se valoriza e moedas emergentes como o real perdem valor. Uma alta forte do franco contra o real sinaliza aversão a risco no mundo.',
  JPY: 'Com juros baixos no Japão, o iene é usado para financiar aplicações em moedas de juro alto, como o real (carry trade). Quando essas operações são desfeitas, o iene sobe e o real cai ao mesmo tempo, e o par mostra esse movimento.',
  GBP: 'Principal moeda europeia fora do euro, relevante para viagens, estudo e serviços contratados no Reino Unido. Ao lado do euro, mostra se um movimento do real é contra a Europa como um todo ou só contra a zona do euro.',
  SEK: 'Moeda flutuante de uma economia pequena e aberta, que costuma oscilar mais que o euro com o ciclo industrial europeu. Interessa a quem tem vínculo com empresas suecas instaladas no Brasil, como Scania, Volvo e Ericsson.',
  DKK: 'Atrelada ao euro pelo mecanismo europeu de taxas de câmbio (MTC II), anda quase igual ao euro contra o real. Serve a quem tem gastos na Dinamarca e como checagem do dado: DKK e EUR divergindo indicaria problema na série.',
};

const INDICATOR_REASONS: Readonly<Record<string, string>> = {
  'fred/IMP3510': 'Mede quanto o Brasil vende aos EUA, o fluxo que as tarifas atingem diretamente. Em 2025 foram US$ 39,9 bi, quase 6% a menos que em 2024 e 11,4% das exportações brasileiras (comparando com a série 22708 do BCB). Sem ajuste sazonal, a variação compara com o mesmo mês do ano anterior.',
  'fred/EXP3510': 'O outro lado: o que o Brasil compra dos EUA, principalmente máquinas, combustíveis, aeronaves e gás natural. Em 2025 foram US$ 54,3 bi (cerca de 11% a mais que em 2024), 18,7% das importações brasileiras. Com IMP3510 dá o saldo bilateral: superávit dos EUA de US$ 14,4 bi em 2025, mais que o dobro dos US$ 6,7 bi de 2024.',
  'fred/IMPCA': 'Grupo de comparação: o Canadá também foi tarifado em 2025 e manda aos EUA cerca de três quartos das suas exportações (75,9% em 2024, segundo a StatCan). Em 2025 os EUA compraram cerca de 7% menos do Canadá; quedas parecidas nos dois países apontam para a política comercial americana, não para um fator só brasileiro.',
  'fred/EXPCA': 'Completa a comparação pelo lado das vendas americanas, num país que respondeu com tarifas próprias em 2025. Essas vendas caíram cerca de 5% em 2025, enquanto as vendas americanas ao Brasil subiram cerca de 11%.',
  'fred/B235RC1Q027SBEA': 'Mede o tamanho do choque tarifário em dinheiro: quanto os importadores americanos pagam de fato. Saiu de US$ 97 bi/ano no 1º trimestre de 2025 para US$ 364 bi/ano no 4º, e estava em US$ 326 bi/ano no 2º trimestre de 2026. Cobre as importações de todos os países, não só as do Brasil.',
  'fred/EPUTRADE': 'Índice de Baker, Bloom e Davis montado a partir de notícias sobre incerteza na política comercial em mais de 2.000 jornais americanos. Sobe quando tarifas são anunciadas, antes que os números de comércio mudem, e incerteza costuma pesar sobre moedas emergentes como o real. Mede o noticiário, não a tarifa em si.',
  'fred/POILBREUSDM': 'Petróleo e derivados são o principal item que o Brasil vende aos EUA (cerca de US$ 6,6 bi em 2025) e ficaram de fora da tarifa de 2026. O Brent é a referência internacional para o petróleo brasileiro e pesa sobre os combustíveis e a inflação no Brasil.',
  'fred/PNGASUSUSDM': 'Henry Hub é o preço de referência do gás nos EUA, e gás natural está entre os principais itens que o Brasil compra de lá. Mostra o custo de um insumo importado pela indústria e pela geração de energia.',
  'fred/PNRGINDEXM': 'Resume petróleo, gás e carvão num número só. Comparado ao IC-Br Energia, que está em reais, separa o que é preço internacional do que é efeito do câmbio.',
  'fred/PIORECRUSDM': 'Um dos maiores produtos de exportação do Brasil, vendido sobretudo à China; o preço move a entrada de dólares no país. Ao lado do dólar australiano (o outro grande exportador) e do real, mostra o efeito do ciclo das commodities no câmbio.',
  'fred/WPU101': 'Ferro e aço são o segundo maior item que o Brasil vende aos EUA (cerca de US$ 5,4 bi em 2025), e o aço já é tarifado à parte pela Seção 232. O índice mostra o preço do aço dentro do mercado americano protegido: subiu cerca de 32% entre jan/2025 e ago/2026.',
  'fred/PMETAINDEXM': 'Resume os metais básicos, como cobre, alumínio, minério de ferro e níquel. Comparado ao IC-Br Metal, em reais, separa preço internacional e câmbio.',
  'fred/PCOFFOTMUSDM': 'O Brasil é o maior produtor e exportador de café do mundo, e os EUA são um dos principais compradores (cerca de US$ 1,9 bi em 2025, fora da tarifa de 2026). A série é o preço indicativo da OIC para arábicas suaves ("Other Milds"), não o do natural brasileiro, mas serve de termômetro do arábica no mercado internacional.',
  'fred/PBEEFUSDM': 'O Brasil é o maior exportador de carne bovina do mundo, e os EUA compraram cerca de US$ 1,3 bi em 2025 (fora da tarifa de 2026). O preço internacional afeta a receita do exportador e o preço da carne no mercado interno.',
  'fred/PORANGUSDM': 'O Brasil lidera a exportação mundial de suco de laranja, e os EUA estão entre os principais destinos (suco e frutas somaram cerca de US$ 1,7 bi em 2025, fora da tarifa de 2026). Mostra a receita de um dos setores mais expostos ao mercado americano.',
  'fred/PSUGAISAUSDM': 'O Brasil é o maior exportador de açúcar do mundo, e o açúcar está entre os itens tarifados em 2026. O preço internacional também pesa na escolha das usinas entre produzir açúcar ou etanol.',
  'fred/PSOYBUSDM': 'Brasil e EUA são os dois maiores exportadores de soja e disputam o mercado chinês; tarifas entre EUA e China desviam compras para o Brasil. É um dos maiores itens da pauta brasileira e pesa na entrada de dólares.',
  'fred/PFOODINDEXM': 'Resume os preços internacionais de alimentos em dólar. Comparado ao IC-Br Agropecuária, em reais, mostra quanto da alta dos alimentos no Brasil vem do mercado externo e quanto vem do câmbio.',
  'sgs/22707': 'Exportações menos importações de bens. O superávit é uma das principais fontes de entrada de dólares e tende a sustentar o real; foi de US$ 59,7 bi em 2025, contra US$ 65,8 bi em 2024.',
  'sgs/22708': 'Tudo o que o Brasil vende ao mundo: US$ 350,5 bi em 2025. É a base para medir o peso dos EUA (IMP3510 dividido por esta série). Census e BCB usam metodologias diferentes, então a razão é aproximada.',
  'sgs/22709': 'Tudo o que o Brasil compra do mundo: US$ 290,8 bi em 2025. Com EXP3510, mostra o peso dos EUA como fornecedor. Importações reagem ao câmbio e à atividade econômica, então ajudam a ler a outra ponta do saldo.',
  'sgs/27574': 'Índice do BCB feito com preços internacionais de commodities convertidos para reais, com pesos que refletem a importância de cada uma para a inflação brasileira. Por estar em reais, soma preço externo e câmbio; segundo o BCB, seus movimentos antecipam parte dos ciclos de inflação (Relatório de Inflação, dez/2017).',
  'sgs/27575': 'Maior segmento do IC-Br (64% dos pesos, em média, de out/2016 a nov/2017, segundo o BCB). Mostra, em reais, a pressão de grãos, carnes, café, açúcar e suco sobre os alimentos; ao lado do índice de alimentos do FMI, separa preço e câmbio.',
  'sgs/27576': 'Segmento de metais do IC-Br (18% dos pesos no mesmo período). Ao lado do índice de metais do FMI, que está em dólar, mostra quanto da variação vem do preço internacional e quanto do câmbio.',
  'sgs/27577': 'Segmento de energia do IC-Br, com petróleo e gás natural (18% dos pesos no mesmo período). Mostra, em reais, a pressão sobre combustíveis e energia; ao lado do Brent e do índice de energia do FMI, separa preço e câmbio.',
};

export function currencyReason(code: string): string | null {
  return CURRENCY_REASONS[code] ?? null;
}

export function indicatorReason(key: IndicatorKey): string | null {
  return INDICATOR_REASONS[`${key.source}/${key.code}`] ?? null;
}
