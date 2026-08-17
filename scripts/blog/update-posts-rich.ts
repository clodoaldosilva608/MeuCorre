// ===== Atualiza os 98 posts existentes no banco de produção =====
//
// Problemas do seed anterior:
// 1. coverUrl ficou null — todos os posts sem imagem de capa
// 2. labels ficou null — sem tags
// 3. Conteúdo é markdown genérico (igual pra todos)
//
// Este script:
// 1. Lista todos os posts via /api/admin/blog
// 2. Pra cada post, PATCH via /api/admin/blog/[id] com:
//    - coverUrl cíclico (10 imagens existentes em /blog-covers/)
//    - labels baseados em categoria + palavras do título
//    - conteúdo markdown rico (gerado por tópicos da categoria)

const BASE_URL = "https://meucorre.vercel.app";
const ADMIN_EMAIL = "clodoaldo608@gmail.com";
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD ?? "");

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  content: string;
  coverUrl: string | null;
  category: string;
  labels: string | null;
  published: boolean;
  createdAt: string;
}

async function login(): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`Login falhou: ${res.status} ${await res.text()}`);
  }
  const setCookie = res.headers.getSetCookie?.() ?? [];
  return setCookie.map((c: string) => c.split(";")[0]).join("; ");
}

// 10 imagens de capa existentes em /public/blog-covers/
const COVERS = [
  "/blog-covers/capa-1.png",
  "/blog-covers/capa-2.png",
  "/blog-covers/capa-3.png",
  "/blog-covers/capa-4.png",
  "/blog-covers/capa-5.png",
  "/blog-covers/capa-6.png",
  "/blog-covers/capa-7.png",
  "/blog-covers/capa-8.png",
  "/blog-covers/capa-9.png",
  "/blog-covers/capa-10.png",
];

function coverForPost(index: number): string {
  return COVERS[index % COVERS.length];
}

// Gera labels (tags) baseadas na categoria + palavras-chave do título
function labelsForPost(post: BlogPost): string {
  const tags: string[] = [];
  const cat = post.category.toLowerCase();
  const title = post.title.toLowerCase();

  // Tag da categoria
  tags.push(cat);

  // Palavras-chave genéricas
  tags.push("entregador", "meucorre", "app-entrega");

  // Tags específicas por palavra no título
  const keywordMap: Record<string, string> = {
    ifood: "ifood",
    "99food": "99food",
    rappi: "rappi",
    lalamove: "lalamove",
    uber: "uber",
    moto: "moto",
    gasolina: "combustivel",
    combustivel: "combustivel",
    etanol: "combustivel",
    pneu: "pneus",
    pneus: "pneus",
    oleo: "manutencao",
    manutencao: "manutencao",
    lucro: "financas",
    ganho: "financas",
    ganhos: "financas",
    dinheiro: "financas",
    despesa: "financas",
    despesas: "financas",
    orcamento: "financas",
    mei: "mei",
    cnpj: "cnpj",
    imposto: "imposto",
    impostos: "imposto",
    ir: "imposto-renda",
    cnh: "cnh",
    seguro: "seguro",
    rastreador: "seguranca",
    capacete: "seguranca",
    bau: "equipamentos",
    mochila: "equipamentos",
    equipamento: "equipamentos",
    equipamentos: "equipamentos",
    chuva: "clima",
    noite: "seguranca",
    feriado: "estrategia",
    semana: "estrategia",
    fim: "estrategia",
    meta: "metas",
    metas: "metas",
    horario: "horarios",
    horarios: "horarios",
    zona: "estrategia",
    zonas: "estrategia",
    bairro: "estrategia",
    bairros: "estrategia",
    cidade: "estrategia",
    cidades: "estrategia",
    saude: "saude",
    stress: "saude-mental",
    postura: "saude",
    alimentacao: "saude",
    bateria: "tecnologia",
    celular: "tecnologia",
    dados: "tecnologia",
    internet: "tecnologia",
    gps: "tecnologia",
    mapa: "tecnologia",
    calor: "tecnologia",
    offline: "tecnologia",
    indicacao: "comunidade",
    comunidade: "comunidade",
    colega: "comunidade",
    colegas: "comunidade",
    picpay: "conta-digital",
    mercadopago: "conta-digital",
    nota: "notas-fiscais",
    notas: "notas-fiscais",
    fiscal: "notas-fiscais",
    avaliacao: "avaliacao",
    cancelamento: "cancelamento",
    gorjeta: "gorjetas",
    gorjetas: "gorjetas",
    pontualidade: "avaliacao",
    cliente: "clientes",
    clientes: "clientes",
    depreciacao: "depreciacao",
    km: "quilometragem",
    quilometragem: "quilometragem",
    corrente: "manutencao",
    freio: "manutencao",
    pastilha: "manutencao",
    pastilhas: "manutencao",
    vela: "manutencao",
    pavio: "manutencao",
    inverno: "clima",
    verao: "clima",
    aposentadoria: "inss",
    auxilio: "inss",
    doenca: "inss",
    investimento: "investir",
    investir: "investir",
    renda: "investir",
  };

  for (const [keyword, tag] of Object.entries(keywordMap)) {
    if (title.includes(keyword) && !tags.includes(tag)) {
      tags.push(tag);
    }
  }

  // Limita a 6 tags
  return tags.slice(0, 6).join(", ");
}

// Gera conteúdo markdown rico por categoria
function generateRichContent(post: BlogPost): string {
  const cat = post.category;
  const title = post.title;
  const desc = post.description;

  // Templates por categoria — cada um com 4-6 seções substanciais
  const templates: Record<string, string> = {
    Finanças: `# ${title}

${desc}

## Por que isso é essencial pra entregador

A maioria dos entregadores foca só em rodar mais, sem olhar pra planilha. O resultado? Trabalha 10, 12 horas por dia e no fim do mês não sabe se tá lucrando ou só cobrindo custo. O segredo dos entregadores que realmente prosperam não é rodar mais — é **entender pra onde o dinheiro tá indo**. Cada real que sai do seu bolso sem ser rastreado é um real que podia estar virando reserva, investimento ou lazer com a família.

Quando você passa a tratar seu corre como um pequeno negócio (que é exatamente o que é), tudo muda. Você começa a questionar se vale a pena fazer aquela corrida de R$ 5 que vai te custar R$ 3 de gasolina. Começa a escolher melhor as horas e os locais. E principalmente, começa a tomar decisões baseadas em dados, não em achismo.

## Os 3 maiores erros financeiros do entregador

### 1. Confundir faturamento com lucro

Faturamento é tudo que entra. Lucro é o que sobra depois de pagar TODAS as despesas — gasolina, óleo, manutenção, alimentação, depreciação da moto, IPVA, seguro. A maioria vive na ilusão de que ganha mais do que realmente ganha.

### 2. Não ter reserva de emergência

Quando a moto quebra (e ela vai quebrar), o entregador sem reserva precisa parar de trabalhar ou recorrer a empréstimos predatórios. Uma reserva de 1 a 3 meses de despesa é fundamental.

### 3. Misturar conta pessoal com conta do corre

Usar a mesma conta pra receber corridas e pagar contas pessoais transforma sua vida financeira em um caos. Separe uma conta (pode ser PicPay ou Mercado Pago) só pro corre.

## Como o MeuCorre resolve isso

O app foi feito justamente pra resolver esses 3 problemas. Ele registra TODAS as suas corridas e despesas, calcula o lucro líquido em tempo real e te mostra gráficos claros de quanto você realmente tá faturando. Funciona 100% offline, então mesmo sem internet você consegue lançar tudo.

Os relatórios mensais (disponíveis no PRO) mostram sua evolução ao longo do tempo, pra você entender se suas estratégias tão dando resultado. E o melhor: seus dados ficam só no seu celular, com total privacidade.

## Passo a passo prático

1. **Baixe o MeuCorre** em [meucorre.vercel.app](https://meucorre.vercel.app)
2. Lance TODAS as corridas do dia (10 segundos por corrida)
3. Lance TODAS as despesas (gasolina, alimentação, óleo)
4. Veja o lucro líquido no final do dia
5. No fim do mês, gere o relatório e analise

## Conclusão

${desc} Lembre-se: o segredo do sucesso como entregador não está em rodar mais, mas em rodar de forma inteligente. **Baixe o MeuCorre gratuitamente** e comece a organizar seu corre hoje mesmo. Sucesso nas ruas! 🏍️`,

    Moto: `# ${title}

${desc}

## A moto é seu patrimônio

Pra entregador, a moto não é só um meio de transporte — é o instrumento de trabalho. Se ela para, você para de ganhar. Por isso, cuidar dela é cuidar do seu bolso. Manutenção preventiva é sempre mais barata que corretiva: uma troca de óleo que custa R$ 80 pode evitar um defeito no motor que custaria R$ 2.000.

Muitos entregadores só levam a moto pro mecânico quando ela para. Isso é um erro caro. O ideal é seguir um cronograma de manutenção preventiva baseado em quilometragem, e não em "quando quebrar". O MeuCorre pode te ajudar com lembretes de manutenção (recurso PRO).

## Cronograma de manutenção recomendado

### Troca de óleo
- **A cada 3.000 km ou 3 meses** (o que vier primeiro)
- Use óleo recomendado pelo fabricante — não economize aqui
- Moto esquentando demais = óleo vencido ou baixo nível

### Pneus
- **Troca quando chegar no TWI (indicador de desgaste)**
- Pneu careca na chuva = acidente garantido
- Calibre semanalmente (30-32 psi na dianteira, 32-35 na traseira)

### Corrente
- **Lubrificação a cada 500 km**
- **Tensionamento a cada 1.000 km**
- Corrente frouxa = perda de potência e desgaste acelerado

### Pastilhas de freio
- **Verificação a cada 5.000 km**
- Troca quando chegar a 2mm de espessura
- Atrito metálico ao frear = pastilha acabou

## Sinais de alerta que você não deve ignorar

- **Barulho estranho no motor** — pode ser óleo, vela, ou coisa pior
- **Fumaça** — azul = queimando óleo, preta = mistura rica, branca = líquido de arrefecimento
- **Dificuldade de partida** — bateria fraca ou vela/cabo vencidos
- **Freio esponjoso** — ar no sistema ou pastilha gasta
- **Vibração em alta velocidade** — pneu desbalanceado ou corrente frouxa

## Custo real de manutenção por mês

Um entregador que roda em média 1.500 km/mês deve separar **entre R$ 200 e R$ 400 por mês** só pra manutenção. Parece muito, mas é só fazer a conta: óleo (R$ 80 a cada 3 meses), pneus (R$ 300 a cada 6 meses), corrente (+ coroa + pinhão R$ 400 a cada 18 meses), pastilhas (R$ 80 a cada 6 meses)... Some tudo e divide por 12.

Esse custo deve entrar na sua planilha de despesas. O MeuCorre tem uma categoria específica pra "Manutenção" — use ela religiosamente. Sem esse número, você não sabe seu lucro real.

## Dica do MeuCorre

Use o recurso de **Lembretes de manutenção** (PRO) pra nunca mais esquecer uma troca de óleo ou revisão. Você cadastra o km atual e o tipo de manutenção, e o app te avisa quando chegar a hora. Simples assim.

## Conclusão

${desc} Cuide bem da sua moto e ela vai cuidar de você. **Baixe o MeuCorre** em [meucorre.vercel.app](https://meucorre.vercel.app) e comece a registrar suas manutenções hoje mesmo.`,

    Economia: `# ${title}

${desc}

## Cada real economizado é um real lucrado

Como entregador, você tem duas formas de aumentar o lucro: ganhar mais ou gastar menos. A segunda opção é muito mais fácil e rápida de implementar. Economizar R$ 20 por dia de gasolina é o mesmo que aumentar seu faturamento em R$ 600 por mês — sem precisar rodar um km a mais.

A diferença é que ganhar mais depende de fatores externos (mais corridas, melhores taxas dos apps), enquanto gastar menos depende 100% de você. Pequenas mudanças de hábito, somadas ao longo do mês, fazem uma diferença enorme no bolso.

## 7 formas comprovadas de economizar como entregador

### 1. Calibre os pneus semanalmente

Pneu baixo aumenta o consumo de gasolina em até 20%. Calibrar é grátis (qualquer posto) e leva 2 minutos. É a economia mais fácil que existe.

### 2. Troque óleo na hora certa

Óleo vencido aumenta o atrito no motor = mais gasolina queimada. Siga o cronograma de 3.000 km ou 3 meses.

### 3. Evite acelerações bruscas

Acelerar aos poucos economiza até 15% de combustível. Cada arrancada agressiva queima mais gasolina que 5 minutos de rodagem normal.

### 4. Use a marcha certa

Andar em marcha alta demais (rotação baixa) força o motor e aumenta o consumo. Mantenha entre 4.000 e 6.000 RPM na maioria das motos.

### 5. Planeje rotas

Antes de aceitar uma corrida longe, veja se vale a pena. Uma corrida de R$ 12 a 8 km de distância pode te custar R$ 4 de gasolina — sobram R$ 8. Valeu a pena?

### 6. Alimentação inteligente

Comer na rua custa caro. Leve marmita de casa. R$ 15 por dia x 22 dias = R$ 330 por mês economizado.

### 7. Evite ociosidade

Se ficou mais de 15 min parado esperando corrida, mude de ponto. Tempo parado = dinheiro perdido (sem ganhar nada e ainda gastando pra ter ido até lá).

## Gasolina vs Etanol: qual compensa?

A regra é simples: o etanol precisa custar no máximo 70% do preço da gasolina pra compensar. Se a gasolina tá R$ 6,50 e o etanol R$ 4,30 — compensa etanol (4,30 / 6,50 = 66%, abaixo de 70%).

Mas atenção: essa conta pode mudar dependendo da sua moto e de como você anda. Faça o teste você mesmo: tanque cheio de gasolina, rode 100 km, anote. Depois tanque cheio de etanol, rode 100 km, anote. Compare.

## Como o MeuCorre ajuda

O app calcula automaticamente seu **custo por km rodado** baseado nas suas despesas reais. Você lança gasolina e o app divide pela quilometragem — sabe exatamente quanto custa cada km. Assim você descobre rapidamente se uma corrida vale a pena ou não.

Também tem o recurso de **Comparativo de apps**, onde você vê qual app te paga mais por km rodado. Dado é poder.

## Conclusão

${desc} Aplique essas dicas e veja seu lucro aumentar sem precisar trabalhar mais. **Baixe o MeuCorre** em [meucorre.vercel.app](https://meucorre.vercel.app) e comece a trackear suas economias hoje mesmo.`,

    Estratégia: `# ${title}

${desc}

## Estratégia é o que separa o entregador próspero do que só sobrevive

Tem entregador que roda 12 horas por dia e mal paga as contas. Outro roda 8 horas e consegue poupar. A diferença? Estratégia. Não é sobre trabalhar mais — é sobre trabalhar melhor. Saber onde estar, quando estar, e quais corridas aceitar.

O entregador estratégico pensa como um negócio. Ele conhece suas zonas, seus horários de pico, seu custo por km, sua taxa de aceitação. Ele toma decisões baseadas em dados, não em sorte ou intuição.

## Conhecendo suas zonas

Cada cidade tem zonas quentes em horários diferentes. Centro comercial é quente no almoço. Bairro residencial é quente no jantar. Universidade é quente no intervalo das aulas. Hospital é quente 24 horas (mas com pouca gorjeta).

A melhor forma de descobrir suas zonas é com **dados próprios**. O MeuCorre tem um recurso de **Mapa de Calor** que mostra exatamente onde você mais faz corridas — e onde você mais ganha. Com 2-3 semanas de dados, você começa a ver padrões.

## Horários de pico por região

### Centro / Distrito Empresarial
- **Pico**: 11h30-13h30 (almoço) e 18h-19h30 (jantar)
- **Volume**: alto
- **Gorjeta**: média
- **Dica**: fique perto de praças de alimentação

### Bairro Residencial
- **Pico**: 19h-22h (jantar em casa) e fim de semana
- **Volume**: médio
- **Gorjeta**: alta (clientes em casa, confortáveis)
- **Dica**: condomínios têm volume recorrente

### Universidade
- **Pico**: 12h-14h e 18h-20h (intervalo)
- **Volume**: alto
- **Gorjeta**: baixa
- **Dica**: aceite em grupo (várias corridas da mesma área)

### Hospital
- **Pico**: 24h
- **Volume**: médio-baixo
- **Gorjeta**: baixa
- **Dica**: bom pra madrugada quando o resto tá vazio

## Quando aceitar e quando recusar

**Aceite sempre:**
- Corridas acima de R$ 8 com menos de 3 km
- Corridas com gorjeta anunciada
- Corridas em grupo (mesmo destino)
- Corridas pra zonas que você conhece bem

**Recuse sem culpa:**
- Corridas abaixo de R$ 5 com mais de 5 km
- Corridas pra zonas perigosas à noite
- Corridas que vão te levar pra área morta (sem retorno)
- Corridas com cliente com avaliação abaixo de 4 estrelas

## A regra do "custo por km"

Antes de aceitar qualquer corrida, faça a conta: valor da corrida ÷ km total. Se der menos de R$ 1,50/km, desconfie. Se der menos de R$ 1,00/km, recuse (a menos que esteja voltando pra casa).

Exemplo: corrida de R$ 10 a 8 km = R$ 1,25/km. Margem apertada. Mas se for R$ 10 a 4 km = R$ 2,50/km. Excelente.

## Como o MeuCorre te dá essa vantagem

O app calcula seu custo real por km (combustível + manutenção + depreciação). Com esse número, você sabe exatamente qual é seu ponto de equilíbrio. Aceita só o que vale a pena.

O **Mapa de Calor** mostra onde você mais fatura. Foca nessas zonas. Evita as que só te dão prejuízo.

## Conclusão

${desc} Pense estratégico, não emocional. **Baixe o MeuCorre** em [meucorre.vercel.app](https://meucorre.vercel.app) e comece a jogar xadrez nas ruas, não damas.`,
  };

  // Template default genérico
  const defaultTemplate = `# ${title}

${desc}

## Por que isso importa pra você, entregador

Ser entregador de aplicativo no Brasil é uma das profissões que mais cresce, mas também uma das que mais exige organização e conhecimento. Muitos entram na profissão achando que é só "ligar o app e sair rodando", mas logo descobrem que sem estratégia e controle, o dinheiro some rápido. Este artigo vai aprofundar em **${cat.toLowerCase()}** pra ajudar você a maximizar seus ganhos e minimizar seus custos.

## O contexto atual do entregador no Brasil

O mercado de entrega por app cresceu exponencialmente nos últimos anos. Hoje existem milhões de entregadores ativos competindo por corridas em dezenas de cidades. A concorrência aumentou, mas também aumentou a demanda — mais pessoas pedindo comida, mais restaurantes cadastrados, mais mercados com entrega própria. Quem se adapta prospera; quem continua fazendo do jeito antigo fica pra trás.

Os apps de entrega (iFood, 99Food, Lalamove, Rappi) têm sistemas de priorização que beneficiam entregadores com boa avaliação, pontualidade e taxa de aceitação razoável. Entender como esses sistemas funcionam é fundamental pra ser priorizado nas melhores corridas.

## Dicas práticas que você pode aplicar hoje

### 1. Organização é tudo

Mantenha um registro diário de todas as suas corridas e despesas. O MeuCorre permite fazer isso de forma simples e rápida, mesmo sem internet. Seus dados ficam salvos no seu celular, com total privacidade. Sem esse registro, você está dirigindo no escuro.

### 2. Conheça seus custos

Muitos entregadores não sabem quanto gastam de gasolina, manutenção e alimentação por dia. Sem esse conhecimento, é impossível saber se você está realmente lucrando. Use o app pra lançar todas as despesas e veja o lucro líquido em tempo real.

### 3. Trabalhe nos horários certos

Os horários de pico variam por região e por app. Em geral:
- **Almoço**: 11h às 14h
- **Jantar**: 18h às 22h
- **Finais de semana**: maior volume geral
- **Feriados**: pico intenso, mas concorrência menor

### 4. Mantenha sua moto em dia

Manutenção preventiva é sempre mais barata que corretiva. Faça revisões periódicas e mantenha um fundo de emergência pra reparos inesperados. Uma moto parada por falta de manutenção é dinheiro perdido.

### 5. Use a tecnologia a seu favor

Apps como o MeuCorre ajudam a organizar seu trabalho, mas também é importante usar o GPS de forma inteligente, conhecer as zonas de maior demanda e evitar áreas com muito trânsito.

## Erros comuns que você deve evitar

- **Não registrar as despesas pequenas** (R$ 5 de café some da mente, mas não do bolso)
- **Aceitar toda corrida** sem calcular se vale a pena
- **Não ter reserva de emergência** pra quando a moto quebrar
- **Trabalhar sem pausas** — cansaço leva a erros e acidentes
- **Misturar dinheiro do corre com dinheiro pessoal**

## Como o MeuCorre resolve esses problemas

O MeuCorre foi feito por entregador, pra entregador. Ele resolve os principais problemas:

- **Controle financeiro completo** — corridas, despesas, lucro líquido
- **Funciona offline** — sem depender de internet
- **Dados privados** — tudo fica no seu celular
- **Relatórios visuais** — gráficos que mostram sua evolução
- **Mapa de calor** — descobre suas melhores zonas
- **Lembretes de manutenção** — nunca mais esqueça uma revisão

Tudo isso de graça pra começar. E o PRO (pagamento único de R$ 18,90) desbloqueia tudo, sem mensalidade.

## Conclusão

${desc} Lembre-se: o segredo do sucesso como entregador não está apenas em rodar mais, mas em rodar de forma inteligente. **Baixe o MeuCorre gratuitamente** em [meucorre.vercel.app](https://meucorre.vercel.app) e comece a organizar seu corre hoje mesmo. Sucesso nas ruas! 🏍️`;

  return templates[cat] || defaultTemplate;
}

async function main() {
  console.log("🔐 Fazendo login...");
  const cookie = await login();
  console.log("✅ Login OK");

  console.log("\n📋 Listando posts atuais...");
  const listRes = await fetch(`${BASE_URL}/api/admin/blog`, {
    headers: { Cookie: cookie },
  });
  if (!listRes.ok) {
    throw new Error(`Erro listando posts: ${listRes.status}`);
  }
  const { posts }: { posts: BlogPost[] } = await listRes.json();
  console.log(`📊 ${posts.length} posts encontrados`);

  console.log("\n🔄 Atualizando posts...");
  let updated = 0;
  let failed = 0;

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const newCover = coverForPost(i);
    const newLabels = labelsForPost(post);
    const newContent = generateRichContent(post);

    // Só atualiza se houver mudança real
    const needsUpdate =
      post.coverUrl !== newCover ||
      post.labels !== newLabels ||
      post.content.length < 1500; // conteúdo antigo é curto

    if (!needsUpdate) {
      process.stdout.write("-");
      continue;
    }

    const res = await fetch(`${BASE_URL}/api/admin/blog/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({
        coverUrl: newCover,
        labels: newLabels,
        content: newContent,
      }),
    });

    if (res.ok) {
      updated++;
      process.stdout.write(".");
    } else {
      failed++;
      process.stdout.write("x");
      console.error(`\nErro em ${post.slug}: ${res.status} ${await res.text()}`);
    }

    if ((i + 1) % 10 === 0) {
      console.log(`\n${i + 1}/${posts.length} processados`);
    }

    // Pequeno delay pra não sobrecarregar o servidor
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log(`\n\n✅ ${updated} posts atualizados, ${failed} falhas`);

  // Verificação final
  const checkRes = await fetch(`${BASE_URL}/api/blog`);
  const checkData = await checkRes.json();
  const totalPosts = checkData.posts?.length ?? 0;
  const withCover = checkData.posts?.filter((p: BlogPost) => p.coverUrl).length ?? 0;
  const withLabels = checkData.posts?.filter((p: BlogPost) => p.labels).length ?? 0;
  console.log(`\n📊 Total público: ${totalPosts} posts`);
  console.log(`   Com capa: ${withCover}`);
  console.log(`   Com labels: ${withLabels}`);
}

main().catch((e) => {
  console.error("❌ Erro fatal:", e);
  process.exit(1);
});
