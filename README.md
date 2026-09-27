# Pulse FX

Acompanhamento do real (PTAX) e do comércio Brasil–EUA sob as tarifas americanas, com dados públicos do Banco Central do
Brasil (BCB) e do FRED. Informação educacional, não é recomendação de investimento.

## Séries acompanhadas e por que cada uma

O Pulse FX responde a duas perguntas: **como o real está se movendo** e **como o comércio com os EUA reage às tarifas
americanas**. Em 2025 os EUA aplicaram tarifas de até 50% sobre produtos brasileiros, derrubadas pela Suprema Corte
americana em fevereiro de 2026; desde 22/07/2026 vale uma tarifa de 25% pela Seção 301, que deixa de fora cerca de 66% do
que o Brasil exporta para os EUA. O conjunto junta o câmbio, o comércio bilateral, o preço do que o Brasil vende e os
totais do lado brasileiro.

Os números citados abaixo foram calculados com os próprios dados do Pulse FX (histórico desde jan/2024), salvo quando há
link para outra fonte.

### Câmbio — BCB PTAX

Fonte: [PTAX (Olinda)](https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/swagger-ui3/). As 10 moedas são o
catálogo inteiro que o BCB publica na PTAX; o sistema importa o catálogo em vez de escolher moedas à mão. O valor exibido
é a PTAX de venda do boletim de fechamento, e a variação compara com 5 dias úteis antes.

- **Dólar dos Estados Unidos (USD)** \
  A PTAX do dólar é a taxa de referência oficial do BCB, usada em contratos, balanços e na liquidação de derivativos
  cambiais. É o "preço do dólar" que aparece em extratos e notícias, e a moeda em que se fatura a maior parte do comércio
  exterior brasileiro, inclusive o comércio com os EUA que o Pulse FX acompanha.
- **Euro (EUR)** \
  Moeda da União Europeia, um dos maiores parceiros comerciais do Brasil e destino frequente de viagem. Ver o euro ao lado
  do dólar separa "real fraco" (o real cai contra os dois) de "dólar forte no mundo" (o real cai só contra o dólar).
- **Dólar canadense (CAD)** \
  O Canadá também foi alvo das tarifas americanas em 2025 e, como o Brasil, exporta commodities. Se o real cai contra o
  dólar americano mas fica estável contra o canadense, o movimento é comum aos dois exportadores; se cai também contra o
  canadense, a causa é brasileira. Faz par com as séries de comércio EUA–Canadá.
- **Dólar australiano (AUD)** \
  Austrália e Brasil são os dois maiores exportadores de minério de ferro do mundo, e o dólar australiano reage ao preço
  das commodities e à demanda da China. Comparar o real com ele, e com a série de minério, mostra se o câmbio está
  acompanhando o ciclo das commodities.
- **Coroa norueguesa (NOK)** \
  A Noruega é grande exportadora de petróleo e gás, e a coroa costuma acompanhar o Brent. Como petróleo é o principal item
  que o Brasil vende aos EUA, a coroa ajuda a ver quanto do movimento do real vem do petróleo.
- **Franco suíço (CHF)** \
  Moeda de refúgio: em crises globais o franco se valoriza e moedas emergentes como o real perdem valor. Uma alta forte do
  franco contra o real sinaliza aversão a risco no mundo.
- **Iene (JPY)** \
  Com juros baixos no Japão, o iene é usado para financiar aplicações em moedas de juro alto, como o real (carry trade).
  Quando essas operações são desfeitas, o iene sobe e o real cai ao mesmo tempo, e o par mostra esse movimento.
- **Libra esterlina (GBP)** \
  Principal moeda europeia fora do euro, relevante para viagens, estudo e serviços contratados no Reino Unido. Ao lado do
  euro, mostra se um movimento do real é contra a Europa como um todo ou só contra a zona do euro.
- **Coroa sueca (SEK)** \
  Moeda flutuante de uma economia pequena e aberta, que costuma oscilar mais que o euro com o ciclo industrial europeu.
  Interessa a quem tem vínculo com empresas suecas instaladas no Brasil, como Scania, Volvo e Ericsson.
- **Coroa dinamarquesa (DKK)** \
  Atrelada ao euro pelo mecanismo europeu de taxas de câmbio (MTC II), anda quase igual ao euro contra o real. Serve a quem
  tem gastos na Dinamarca e como checagem do dado: DKK e EUR divergindo indicaria problema na série.

### Comércio EUA — Census via FRED (mensal, US$ milhões, sem ajuste sazonal)

- **Importações dos EUA vindas do Brasil** — [`IMP3510`](https://fred.stlouisfed.org/series/IMP3510) \
  Mede quanto o Brasil vende aos EUA, o fluxo que as tarifas atingem diretamente. Em 2025 foram US$ 39,9 bi, quase 6% a
  menos que em 2024 e 11,4% das exportações brasileiras (comparando com a série `22708` do BCB). Sem ajuste sazonal, a
  variação compara com o mesmo mês do ano anterior.
- **Exportações dos EUA para o Brasil** — [`EXP3510`](https://fred.stlouisfed.org/series/EXP3510) \
  O outro lado: o que o Brasil compra dos EUA, principalmente máquinas, combustíveis, aeronaves e gás natural. Em 2025
  foram US$ 54,3 bi (cerca de 11% a mais que em 2024), 18,7% das importações brasileiras. Com `IMP3510` dá o saldo
  bilateral: superávit dos EUA de US$ 14,4 bi em 2025, mais que o dobro dos US$ 6,7 bi de 2024.
- **Importações dos EUA vindas do Canadá** — [`IMPCA`](https://fred.stlouisfed.org/series/IMPCA) \
  Grupo de comparação: o Canadá também foi tarifado em 2025 e manda aos EUA cerca de três quartos das suas exportações
  (75,9% em 2024, segundo a [StatCan](https://www150.statcan.gc.ca/n1/daily-quotidien/260219/dq260219a-eng.htm)). Em 2025
  os EUA compraram cerca de 7% menos do Canadá; quedas parecidas nos dois países apontam para a política comercial
  americana, não para um fator só brasileiro.
- **Exportações dos EUA para o Canadá** — [`EXPCA`](https://fred.stlouisfed.org/series/EXPCA) \
  Completa a comparação pelo lado das vendas americanas, num país que respondeu com tarifas próprias em 2025. Essas vendas
  caíram cerca de 5% em 2025, enquanto as vendas americanas ao Brasil subiram cerca de 11%.

### Tarifas — FRED

- **Tarifas de importação arrecadadas pelos EUA** — [`B235RC1Q027SBEA`](https://fred.stlouisfed.org/series/B235RC1Q027SBEA)
  (BEA, trimestral, US$ bilhões em taxa anual com ajuste sazonal) \
  Mede o tamanho do choque tarifário em dinheiro: quanto os importadores americanos pagam de fato. Saiu de US$ 97 bi/ano
  no 1º trimestre de 2025 para US$ 364 bi/ano no 4º, e estava em US$ 326 bi/ano no 2º trimestre de 2026. Cobre as
  importações de todos os países, não só as do Brasil.
- **Incerteza da política comercial dos EUA** — [`EPUTRADE`](https://fred.stlouisfed.org/series/EPUTRADE) (mensal, índice) \
  Índice de Baker, Bloom e Davis montado a partir de notícias sobre incerteza na política comercial em mais de 2.000
  jornais americanos. Sobe quando tarifas são anunciadas, antes que os números de comércio mudem, e incerteza costuma pesar
  sobre moedas emergentes como o real. Mede o noticiário, não a tarifa em si.

### Energia — preços do FMI via FRED (médias mensais em dólar)

- **Petróleo Brent** — [`POILBREUSDM`](https://fred.stlouisfed.org/series/POILBREUSDM) (US$/barril) \
  Petróleo e derivados são o principal item que o Brasil vende aos EUA (cerca de US$ 6,6 bi em 2025) e ficaram de fora da
  tarifa de 2026. O Brent é a referência internacional para o petróleo brasileiro e pesa sobre os combustíveis e a
  inflação no Brasil.
- **Gás natural (Henry Hub, EUA)** — [`PNGASUSUSDM`](https://fred.stlouisfed.org/series/PNGASUSUSDM) (US$/milhão de BTU) \
  Henry Hub é o preço de referência do gás nos EUA, e gás natural está entre os principais itens que o Brasil compra de
  lá. Mostra o custo de um insumo importado pela indústria e pela geração de energia.
- **Índice global de preços de energia** — [`PNRGINDEXM`](https://fred.stlouisfed.org/series/PNRGINDEXM) (2016 = 100) \
  Resume petróleo, gás e carvão num número só. Comparado ao IC-Br Energia, que está em reais, separa o que é preço
  internacional do que é efeito do câmbio.

### Metais — FMI e BLS via FRED

- **Minério de ferro** — [`PIORECRUSDM`](https://fred.stlouisfed.org/series/PIORECRUSDM) (US$/tonelada) \
  Um dos maiores produtos de exportação do Brasil, vendido sobretudo à China; o preço move a entrada de dólares no país.
  Ao lado do dólar australiano (o outro grande exportador) e do real, mostra o efeito do ciclo das commodities no câmbio.
- **Preço ao produtor de ferro e aço nos EUA** — [`WPU101`](https://fred.stlouisfed.org/series/WPU101) (BLS, 1982 = 100) \
  Ferro e aço são o segundo maior item que o Brasil vende aos EUA (cerca de US$ 5,4 bi em 2025), e o aço já é tarifado à
  parte pela Seção 232. O índice mostra o preço do aço dentro do mercado americano protegido: subiu cerca de 32% entre
  jan/2025 e ago/2026.
- **Índice global de preços de metais** — [`PMETAINDEXM`](https://fred.stlouisfed.org/series/PMETAINDEXM) (2016 = 100) \
  Resume os metais básicos, como cobre, alumínio, minério de ferro e níquel. Comparado ao IC-Br Metal, em reais, separa
  preço internacional e câmbio.

### Agro — preços do FMI via FRED (médias mensais em dólar)

- **Café arábica** — [`PCOFFOTMUSDM`](https://fred.stlouisfed.org/series/PCOFFOTMUSDM) (US¢/libra-peso) \
  O Brasil é o maior produtor e exportador de café do mundo, e os EUA são um dos principais compradores (cerca de US$ 1,9
  bi em 2025, fora da tarifa de 2026). A série é o preço indicativo da OIC para arábicas suaves ("Other Milds"), não o do
  natural brasileiro, mas serve de termômetro do arábica no mercado internacional.
- **Carne bovina** — [`PBEEFUSDM`](https://fred.stlouisfed.org/series/PBEEFUSDM) (US¢/libra-peso) \
  O Brasil é o maior exportador de carne bovina do mundo, e os EUA compraram cerca de US$ 1,3 bi em 2025 (fora da tarifa
  de 2026). O preço internacional afeta a receita do exportador e o preço da carne no mercado interno.
- **Laranja** — [`PORANGUSDM`](https://fred.stlouisfed.org/series/PORANGUSDM) (US$/libra-peso) \
  O Brasil lidera a exportação mundial de suco de laranja, e os EUA estão entre os principais destinos (suco e frutas
  somaram cerca de US$ 1,7 bi em 2025, fora da tarifa de 2026). Mostra a receita de um dos setores mais expostos ao
  mercado americano.
- **Açúcar** — [`PSUGAISAUSDM`](https://fred.stlouisfed.org/series/PSUGAISAUSDM) (contrato nº 11, US¢/libra-peso) \
  O Brasil é o maior exportador de açúcar do mundo, e o açúcar está entre os itens tarifados em 2026. O preço
  internacional também pesa na escolha das usinas entre produzir açúcar ou etanol.
- **Soja** — [`PSOYBUSDM`](https://fred.stlouisfed.org/series/PSOYBUSDM) (US$/tonelada) \
  Brasil e EUA são os dois maiores exportadores de soja e disputam o mercado chinês; tarifas entre EUA e China desviam
  compras para o Brasil. É um dos maiores itens da pauta brasileira e pesa na entrada de dólares.
- **Índice global de preços de alimentos** — [`PFOODINDEXM`](https://fred.stlouisfed.org/series/PFOODINDEXM) (2016 = 100) \
  Resume os preços internacionais de alimentos em dólar. Comparado ao IC-Br Agropecuária, em reais, mostra quanto da alta
  dos alimentos no Brasil vem do mercado externo e quanto vem do câmbio.

### Brasil — BCB SGS (mensal)

- **Saldo da balança comercial do Brasil** — [`22707`](https://api.bcb.gov.br/dados/serie/bcdata.sgs.22707/dados/ultimos/12?formato=json)
  (balanço de pagamentos, US$ milhões) \
  Exportações menos importações de bens. O superávit é uma das principais fontes de entrada de dólares e tende a sustentar
  o real; foi de US$ 59,7 bi em 2025, contra US$ 65,8 bi em 2024.
- **Exportações de bens do Brasil** — [`22708`](https://api.bcb.gov.br/dados/serie/bcdata.sgs.22708/dados/ultimos/12?formato=json)
  (US$ milhões) \
  Tudo o que o Brasil vende ao mundo: US$ 350,5 bi em 2025. É a base para medir o peso dos EUA (`IMP3510` dividido por
  esta série). Census e BCB usam metodologias diferentes, então a razão é aproximada.
- **Importações de bens do Brasil** — [`22709`](https://api.bcb.gov.br/dados/serie/bcdata.sgs.22709/dados/ultimos/12?formato=json)
  (US$ milhões) \
  Tudo o que o Brasil compra do mundo: US$ 290,8 bi em 2025. Com `EXP3510`, mostra o peso dos EUA como fornecedor.
  Importações reagem ao câmbio e à atividade econômica, então ajudam a ler a outra ponta do saldo.
- **Índice de Commodities Brasil (IC-Br)** — [`27574`](https://api.bcb.gov.br/dados/serie/bcdata.sgs.27574/dados/ultimos/12?formato=json)
  (dez/2005 = 100) \
  Índice do BCB feito com preços internacionais de commodities convertidos para reais, com pesos que refletem a
  importância de cada uma para a inflação brasileira. Por estar em reais, soma preço externo e câmbio; segundo o BCB, seus
  movimentos antecipam parte dos ciclos de inflação
  ([Relatório de Inflação, dez/2017](https://www.bcb.gov.br/content/ri/relatorioinflacao/201712/RELINF201712-ri201712b3p.pdf)).
- **IC-Br Agropecuária** — [`27575`](https://api.bcb.gov.br/dados/serie/bcdata.sgs.27575/dados/ultimos/12?formato=json) \
  Maior segmento do IC-Br (64% dos pesos, em média, de out/2016 a nov/2017, segundo o BCB). Mostra, em reais, a pressão de
  grãos, carnes, café, açúcar e suco sobre os alimentos; ao lado do índice de alimentos do FMI, separa preço e câmbio.
- **IC-Br Metal** — [`27576`](https://api.bcb.gov.br/dados/serie/bcdata.sgs.27576/dados/ultimos/12?formato=json) \
  Segmento de metais do IC-Br (18% dos pesos no mesmo período). Ao lado do índice de metais do FMI, que está em dólar,
  mostra quanto da variação vem do preço internacional e quanto do câmbio.
- **IC-Br Energia** — [`27577`](https://api.bcb.gov.br/dados/serie/bcdata.sgs.27577/dados/ultimos/12?formato=json) \
  Segmento de energia do IC-Br, com petróleo e gás natural (18% dos pesos no mesmo período). Mostra, em reais, a pressão
  sobre combustíveis e energia; ao lado do Brent e do índice de energia do FMI, separa preço e câmbio.

### O que ficou de fora

- `DEXBZUS` e `DEXCAUS` (câmbio publicado pelo Fed): repetem a PTAX, que já traz USD e CAD.
- Exportações do Brasil para os EUA por produto: nenhuma das duas fontes publica. O dado oficial está no Comex Stat
  (MDIC), que não foi integrado; os valores por produto citados acima vêm das fontes externas listadas a seguir.

### Fontes do contexto

- [USTR — Seção 301, ação final sobre o Brasil (15/07/2026)](https://ustr.gov/sites/default/files/files/Issue_Areas/Enforcement/Section%20301/Brazil%20301%20Final%20Action%20FRN%207-15-2026%20final.pdf)
- [PIIE — Trump's new tariffs on Brazil](https://www.piie.com/blogs/realtime-economics/2026/trumps-new-tariffs-brazil-reflect-weakness-us-trade-strategy)
- [CNN Brasil — itens mais exportados pelo Brasil aos EUA](https://www.cnnbrasil.com.br/economia/macroeconomia/petroleo-cafe-e-aeronaves-veja-itens-mais-exportados-pelo-brasil-aos-eua/)
- [StatCan — Canadian international merchandise trade, dez/2025](https://www150.statcan.gc.ca/n1/daily-quotidien/260219/dq260219a-eng.htm)
- [BCB — Revisão metodológica do IC-Br (Relatório de Inflação, dez/2017)](https://www.bcb.gov.br/content/ri/relatorioinflacao/201712/RELINF201712-ri201712b3p.pdf)
