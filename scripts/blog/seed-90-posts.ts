// ===== Seed: 90 posts de blog (1/dia, 90 dias) =====
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["error"] });

function generateContent(title: string, description: string, category: string): string {
  return `# ${title}

${description}

## Introdução

Ser entregador de aplicativo no Brasil é uma das profissões que mais cresce, mas também uma das que mais exige organização e conhecimento. Neste artigo, vamos aprofundar em **${category.toLowerCase()}** para ajudar você a maximizar seus ganhos e minimizar seus custos.

## Por que isso importa?

Muitos entregadores focam apenas em rodar mais, sem perceber que pequenas mudanças na forma como gerenciam seu trabalho podem ter um impacto enorme no lucro final. O MeuCorre existe justamente para ajudar nessa gestão — desde o controle de corridas e despesas até a visualização do lucro líquido real.

## Dicas práticas

### 1. Organização é tudo

Mantenha um registro diário de todas as suas corridas e despesas. O MeuCorre permite fazer isso de forma simples e rápida, mesmo sem internet. Seus dados ficam salvos no seu celular, com total privacidade.

### 2. Conheça seus custos

Muitos entregadores não sabem quanto gastam de gasolina, manutenção e alimentação por dia. Sem esse conhecimento, é impossível saber se você está realmente lucrando. Use o app para lançar todas as despesas e veja o lucro líquido em tempo real.

### 3. Trabalhe nos horários certos

Os horários de pico variam por região e por app. Em geral, os melhores horários são:
- **Almoço**: 11h às 14h
- **Jantar**: 18h às 22h
- **Finais de semana**: maior volume geral

### 4. Mantenha sua moto em dia

A manutenção preventiva é sempre mais barata que a corretiva. Faça revisões periódicas e mantenha um fundo de emergência para reparos inesperados.

### 5. Use a tecnologia a seu favor

Apps como o MeuCorre ajudam a organizar seu trabalho, mas também é importante usar o GPS de forma inteligente, conhecer as zonas de maior demanda e evitar áreas com muito trânsito.

## Conclusão

${description} Lembre-se: o segredo do sucesso como entregador não está apenas em rodar mais, mas em rodar de forma inteligente. Baixe o MeuCorre gratuitamente e comece a organizar seu corre hoje mesmo.

**Baixe o app:** [https://meucorre.vercel.app](https://meucorre.vercel.app)

---

*Este artigo faz parte do calendário editorial de 90 dias do MeuCorre, com conteúdo diário para ajudar entregadores de aplicativo a melhorarem sua gestão financeira e operacional.*`;
}

const TOPICS = [
  { slug: "calcular-lucro-real-entregador", title: "Como Calcular o Lucro Real Como Entregador de App", desc: "Aprenda a diferença entre faturamento e lucro líquido.", cat: "Finanças", tags: "lucro,faturamento,despesas" },
  { slug: "planejamento-financeiro-motoboys", title: "Planejamento Financeiro para Motoboys: Guia Completo 2026", desc: "Aprenda a fazer orçamento e reserva de emergência.", cat: "Finanças", tags: "planejamento,orçamento,metas" },
  { slug: "manutencao-moto-entregadores", title: "Manutenção da Moto para Entregadores: Checklist Completo", desc: "Guia de manutenção preventiva e corretiva.", cat: "Moto", tags: "manutenção,moto,checklist" },
  { slug: "economizar-combustivel-entregador", title: "Como Economizar Combustível Sendo Entregador", desc: "Técnicas para reduzir gasto de gasolina.", cat: "Economia", tags: "combustível,gasolina,economia" },
  { slug: "melhores-horarios-zonas-entregar", title: "Melhores Horários e Zonas para Entregar em Cada App", desc: "Maximize seus ganhos nos horários certos.", cat: "Estratégia", tags: "horários,zonas,estratégia" },
  { slug: "equipamentos-essenciais-entregadores", title: "Equipamentos Essenciais para Entregadores de App", desc: "Lista de equipamentos que todo entregador precisa.", cat: "Equipamentos", tags: "equipamentos,bau,mochila" },
  { slug: "gestao-tempo-entregadores", title: "Gestão de Tempo para Entregadores: Como Rodar Mais", desc: "Otimize rotas e gerencie pausas.", cat: "Produtividade", tags: "tempo,rotas,produtividade" },
  { slug: "declaracao-imposto-renda-entregadores-2026", title: "Declaração de Imposto de Renda para Entregadores 2026", desc: "Guia sobre IRPF, MEI e deduções.", cat: "Impostos", tags: "imposto,renda,mei" },
  { slug: "qual-app-entrega-da-mais-dinheiro-2026", title: "Qual App de Entrega Dá Mais Dinheiro? Comparativo 2026", desc: "Comparativo entre iFood, 99Food, Lalamove e Rappi.", cat: "Comparativo", tags: "comparativo,ifood,rappi" },
  { slug: "entregador-5-estrelas-todos-apps", title: "Como Se Tornar um Entregador 5 Estrelas em Todos os Apps", desc: "Dicas para conseguir avaliações máximas.", cat: "Dicas", tags: "avaliação,5-estrelas,dicas" },
  { slug: "como-se-tornar-mei-entregador", title: "Como se Tornar MEI Sendo Entregador de App", desc: "Guia para abrir MEI e ter CNPJ.", cat: "Finanças", tags: "mei,cnpj,formalizacao" },
  { slug: "seguro-para-moto-entregador", title: "Seguro para Moto de Entregador: Vale a Pena?", desc: "Tipos, custos e cobertura de seguro.", cat: "Seguro", tags: "seguro,moto,proteção" },
  { slug: "calculo-km-por-litro-entregador", title: "Como Calcular KM por Litro e Custo por Corrida", desc: "Saiba quanto sua moto gasta por km.", cat: "Finanças", tags: "km,combustível,cálculo" },
  { slug: "rotas-mais-rentaveis-entrega", title: "Rotas Mais Renteis: Como Escolher as Melhores Entregas", desc: "Aceite apenas entregas que valem a pena.", cat: "Estratégia", tags: "rotas,rentabilidade" },
  { slug: "bau-termico-vs-mochila", title: "Baú Térmico vs Mochila: Qual Escolher?", desc: "Comparativo para entregadores.", cat: "Equipamentos", tags: "baú,mochila,equipamento" },
  { slug: "como-lidar-clientes-dificeis", title: "Como Lidar com Clientes Difíceis sem Perder Avaliação", desc: "Técnicas para manter 5 estrelas.", cat: "Dicas", tags: "clientes,avaliação" },
  { slug: "reserva-emergencia-entregador", title: "Reserva de Emergência: Quanto Guardar", desc: "Crie reserva financeira para imprevistos.", cat: "Finanças", tags: "reserva,emergência" },
  { slug: "pneus-moto-entregador", title: "Pneus para Moto de Entregador: Quando Trocar", desc: "Durabilidade, tipos e custo-benefício.", cat: "Moto", tags: "pneus,troca,segurança" },
  { slug: "trabalhar-fins-semana-vale", title: "Trabalhar aos Fins de Semana Vale a Pena?", desc: "Comparativo de ganhos.", cat: "Estratégia", tags: "fim-de-semana,ganhos" },
  { slug: "organizar-corridas-por-app", title: "Como Organizar Corridas por App sem Se Perder", desc: "Trabalhe com múltiplos apps.", cat: "Produtividade", tags: "organização,apps" },
  { slug: "calibrar-pneus-moto-entregador", title: "Como Calibrar Pneus de Moto: Economize Combustível", desc: "Calibragem certa economiza gasolina.", cat: "Moto", tags: "calibragem,pneus" },
  { slug: "descontos-parceiros-entregador", title: "Descontos para Entregadores: Onde Economizar", desc: "Lista de descontos exclusivos.", cat: "Economia", tags: "descontos,parceiros" },
  { slug: "meta-diaria-ganhos-entregador", title: "Como Definir Meta Diária de Ganhos", desc: "Estabeleça metas realistas.", cat: "Finanças", tags: "metas,ganhos" },
  { slug: "troca-oleo-moto-entregador", title: "Troca de Óleo: Quando Fazer na Moto de Entrega", desc: "Guia sobre troca de óleo.", cat: "Moto", tags: "óleo,troca,manutenção" },
  { slug: "como-evitar-multas-transito", title: "Como Evitar Multas de Trânsito Sendo Entregador", desc: "Proteja sua CNH.", cat: "Dicas", tags: "multas,trânsito,cnh" },
  { slug: "app-meucorre-funciona-offline", title: "MeuCorre Funciona Offline? Como o App Ajuda", desc: "Guarde dados sem internet.", cat: "Dicas", tags: "offline,pwa,meucorre" },
  { slug: "beneficios-ser-mei-entregador", title: "Benefícios de Ser MEI como Entregador", desc: "INSS, aposentadoria, auxílio-doença.", cat: "Finanças", tags: "mei,benefícios,inss" },
  { slug: "compartilhar-ganhos-colegas", title: "Por Que Compartilhar Ganhos com Colegas Te Ajuda", desc: "Troca de experiências.", cat: "Comunidade", tags: "comunidade,colegas" },
  { slug: "melhores-bairros-entregar-sao-paulo", title: "Melhores Bairros para Entregar em São Paulo", desc: "Análise de rentabilidade.", cat: "Estratégia", tags: "são-paulo,bairros" },
  { slug: "melhores-bairros-entregar-recife", title: "Melhores Bairros para Entregar no Recife", desc: "Análise de rentabilidade.", cat: "Estratégia", tags: "recife,bairros" },
  { slug: "melhores-bairros-entregar-rio", title: "Melhores Bairros para Entregar no Rio de Janeiro", desc: "Análise de rentabilidade.", cat: "Estratégia", tags: "rio,bairros" },
  { slug: "economizar-alimentacao-entregador", title: "Como Economizar em Alimentação Sendo Entregador", desc: "Coma bem gastando pouco.", cat: "Economia", tags: "alimentação,economia" },
  { slug: "capacete-entregador-importancia", title: "Capacete de Entregador: Segurança e Conforto", desc: "A importância de um bom capacete.", cat: "Equipamentos", tags: "capacete,segurança" },
  { slug: "luvas-jaqueta-chuva-entregador", title: "Luvas, Jaqueta e Capa de Chuva: Essenciais", desc: "Proteção para todas as condições.", cat: "Equipamentos", tags: "luvas,jaqueta,chuva" },
  { slug: "como-funciona-pagamento-ifood", title: "Como Funciona o Pagamento do iFood", desc: "Sistema de pagamentos e taxas.", cat: "Finanças", tags: "ifood,pagamento" },
  { slug: "como-funciona-pagamento-rappi", title: "Como Funciona o Pagamento da Rappi", desc: "Sistema de pagamentos da Rappi.", cat: "Finanças", tags: "rappi,pagamento" },
  { slug: "ferramenta-multiplataforma-entregas", title: "Por Que Usar uma Ferramenta Multiplataforma", desc: "Vantagens do MeuCorre.", cat: "Produtividade", tags: "multiplataforma,meucorre" },
  { slug: "custo-manutencao-moto-mes", title: "Custo de Manutenção da Moto por Mês", desc: "Calcule quanto sua moto custa.", cat: "Finanças", tags: "manutenção,custo" },
  { slug: "depreciacao-moto-entregador", title: "Depreciação da Moto: O Custo Invisível", desc: "Como a depreciação afeta o lucro.", cat: "Finanças", tags: "depreciação,moto" },
  { slug: "como-controlar-quilometragem", title: "Como Controlar a Quilometragem das Corridas", desc: "Registre km para calcular custos.", cat: "Produtividade", tags: "quilometragem,km" },
  { slug: "trabalhar-noite-entregador-seguranca", title: "Trabalhar à Noite: Dicas de Segurança", desc: "Mantenha-se seguro nas entregas noturnas.", cat: "Dicas", tags: "noite,segurança" },
  { slug: "pavio-vela-moto-entregador", title: "Pavio e Vela da Moto: Quando Trocar", desc: "Manutenção que muitos esquecem.", cat: "Moto", tags: "pavio,vela,manutenção" },
  { slug: "frenagem-moto-entregador-pastilhas", title: "Pastilhas de Freio: Quando Trocar", desc: "Sinais de desgaste das pastilhas.", cat: "Moto", tags: "freio,pastilhas" },
  { slug: "como-organizar-bau-moto", title: "Como Organizar o Baú da Moto para Entregas", desc: "Evite atrasos e danos.", cat: "Produtividade", tags: "baú,organização" },
  { slug: "comissao-app-entrega-entenda", title: "Comissão dos Apps: Quanto Eles Levam", desc: "Análise das taxas cobradas.", cat: "Finanças", tags: "comissão,taxas" },
  { slug: "gorjetas-entregador-como-conseguir", title: "Gorjetas: Como Conseguir Mais", desc: "Estratégias para aumentar gorjetas.", cat: "Dicas", tags: "gorjetas,dicas" },
  { slug: "trabalhar-chuva-entregador-dicas", title: "Trabalhar na Chuva: Dicas para Entregadores", desc: "Preparação e segurança.", cat: "Dicas", tags: "chuva,segurança" },
  { slug: "como-renovar-cnh-entregador", title: "Como Renovar a CNH Sendo Entregador", desc: "Prazos, custos e documentos.", cat: "Dicas", tags: "cnh,renovação" },
  { slug: "combustivel-etanol-gasolina-moto", title: "Etanol ou Gasolina: Qual Compensa Mais?", desc: "Comparativo de rendimento e preço.", cat: "Economia", tags: "etanol,gasolina" },
  { slug: "app-rastreador-moto-entregador", title: "Rastreador para Moto: Vale a Pena?", desc: "Análise de rastreadores.", cat: "Seguro", tags: "rastreador,segurança" },
  { slug: "como-cobrir-corridas-colegas", title: "Como Cobrir Corridas de Colegas", desc: "Ajude sem se prejudicar.", cat: "Comunidade", tags: "colegas,ajuda" },
  { slug: "estrategia-aceitar-recusar-corridas", title: "Estratégia: Quando Aceitar e Recusar Corridas", desc: "Maximize lucro dizendo não.", cat: "Estratégia", tags: "aceitar,recusar" },
  { slug: "mapa-calor-zonas-entrega", title: "Mapa de Calor: Descubra Zonas Rentáveis", desc: "Use o mapa do MeuCorre.", cat: "Estratégia", tags: "mapa,calor,zonas" },
  { slug: "investir-lucro-entregador", title: "Como Investir o Lucro de Entregador", desc: "Faça o dinheiro render.", cat: "Finanças", tags: "investir,renda" },
  { slug: "corrida-do-dia-gps-meucorre", title: "Corre do Dia: Como o GPS do MeuCorre Ajuda", desc: "Cronômetro e rastreamento GPS.", cat: "Dicas", tags: "gps,corre-do-dia" },
  { slug: "como-pedir-aumento-taxa-app", title: "Como Negociar Melhores Taxas", desc: "Dicas de negociação.", cat: "Finanças", tags: "negociação,taxas" },
  { slug: "primeiros-passos-entregador-app", title: "Primeiros Passos como Entregador de App", desc: "Guia do iniciante.", cat: "Dicas", tags: "iniciante,guia" },
  { slug: "erros-comuns-entregadores-iniciantes", title: "7 Erros Comuns de Iniciantes e Como Evitar", desc: "Erros que custam dinheiro.", cat: "Dicas", tags: "erros,iniciante" },
  { slug: "como-manter-moto-limpa-entregador", title: "Como Manter a Moto Limpa", desc: "Limpeza e conservação.", cat: "Moto", tags: "limpeza,conservação" },
  { slug: "alimentacao-saudavel-entregador-rua", title: "Alimentação Saudável na Rua", desc: "Coma bem gastando pouco.", cat: "Saúde", tags: "alimentação,saúde" },
  { slug: "postura-corpo-entregador-moto", title: "Postura e Saúde: Proteja o Corpo", desc: "Evite dores nas costas.", cat: "Saúde", tags: "postura,saúde" },
  { slug: "como-lidar-com-stress-entregador", title: "Como Lidar com o Stress de Entregas", desc: "Saúde mental no trabalho.", cat: "Saúde", tags: "stress,mental" },
  { slug: "auxilio-doenca-mei-entregador", title: "Auxílio-Doença MEI: Como Funciona", desc: "Receba auxílio sendo MEI.", cat: "Finanças", tags: "auxílio,doença,mei" },
  { slug: "aposentadoria-entregador-mei", title: "Aposentadoria do Entregador MEI", desc: "Como se preparar.", cat: "Finanças", tags: "aposentadoria,mei" },
  { slug: "como-fazer-orcamento-mensal-entregador", title: "Como Fazer Orçamento Mensal", desc: "Passo a passo do orçamento.", cat: "Finanças", tags: "orçamento,mensal" },
  { slug: "dividir-ganhos-por-app-analise", title: "Como Dividir Ganhos por App", desc: "Análise de rentabilidade.", cat: "Finanças", tags: "análise,apps" },
  { slug: "custo-por-km-rodado-moto", title: "Custo por KM Rodado: Como Calcular", desc: "Fórmula completa.", cat: "Finanças", tags: "custo,km,cálculo" },
  { slug: "bateria-moto-entregador-cuidados", title: "Bateria da Moto: Cuidados Especiais", desc: "Prolongue a vida útil.", cat: "Moto", tags: "bateria,cuidados" },
  { slug: "corrente-moto-troca-entregador", title: "Corrente da Moto: Quando Trocar", desc: "Manutenção da corrente.", cat: "Moto", tags: "corrente,lubrificação" },
  { slug: "como-escolher-moto-entrega", title: "Como Escolher a Moto Ideal para Entregas", desc: "Critérios de escolha.", cat: "Equipamentos", tags: "moto,escolha" },
  { slug: "ifood-vs-99food-comparativo", title: "iFood vs 99Food: Qual Paga Mais?", desc: "Comparativo detalhado.", cat: "Comparativo", tags: "ifood,99food" },
  { slug: "lalamove-vs-rappi-comparativo", title: "Lalamove vs Rappi: Qual é Melhor?", desc: "Ganhos, taxas e volume.", cat: "Comparativo", tags: "lalamove,rappi" },
  { slug: "trabalhar-cidade-pequena-entrega", title: "Entregar em Cidade Pequena Vale a Pena?", desc: "Análise de viabilidade.", cat: "Estratégia", tags: "cidade-pequena" },
  { slug: "como-migrar-uber-entregador", title: "Como Migrar de Uber para Entregador", desc: "Guia para motoristas.", cat: "Dicas", tags: "uber,migração" },
  { slug: "melhores-cidades-entregar-brasil", title: "Melhores Cidades para Entregar em 2026", desc: "Ranking de rentabilidade.", cat: "Estratégia", tags: "cidades,ranking" },
  { slug: "picpay-mercadopago-entregador", title: "PicPay vs Mercado Pago: Qual Usar?", desc: "Contas digitais para entregadores.", cat: "Finanças", tags: "picpay,mercadopago" },
  { slug: "como-declarar-ganhos-entregador", title: "Como Declarar Ganhos no Imposto de Renda", desc: "Declaração de ganhos no IRPF.", cat: "Impostos", tags: "declaração,ir" },
  { slug: "notas-fiscais-entregador-mei", title: "Notas Fiscais para Entregador MEI", desc: "Como emitir notas fiscais.", cat: "Finanças", tags: "notas,fiscais,mei" },
  { slug: "como-funciona-avaliacao-entregador", title: "Como Funciona a Avaliação nos Apps", desc: "Sistema de avaliação.", cat: "Dicas", tags: "avaliação,sistema" },
  { slug: "dicas-pontualidade-entregador", title: "Dicas de Pontualidade: Nunca Atrase", desc: "Seja pontual, mantenha 5 estrelas.", cat: "Dicas", tags: "pontualidade" },
  { slug: "como-lidar-com-cancellation", title: "Como Lidar com Cancelamentos de Pedidos", desc: "Proteja-se de cancelamentos.", cat: "Dicas", tags: "cancelamento" },
  { slug: "seguro-vida-entregador", title: "Seguro de Vida para Entregadores", desc: "Vale a pena?", cat: "Seguro", tags: "seguro-vida" },
  { slug: "como-economizar-bateria-celular", title: "Como Economizar Bateria do Celular", desc: "O celular dura o dia todo.", cat: "Dicas", tags: "bateria,celular" },
  { slug: "plano-dados-celular-entregador", title: "Melhor Plano de Dados para Entregadores", desc: "Quanto de internet consumir.", cat: "Economia", tags: "dados,internet" },
  { slug: "como-trabalhar-feriados-entregador", title: "Trabalhar em Feriados Vale a Pena?", desc: "Análise de ganhos.", cat: "Estratégia", tags: "feriados" },
  { slug: "como-preparar-moto-verao", title: "Como Preparar a Moto para o Verão", desc: "Cuidados com calor.", cat: "Moto", tags: "verão,calor" },
  { slug: "como-preparar-moto-inverno", title: "Como Preparar a Moto para o Inverno", desc: "Cuidados com frio e chuva.", cat: "Moto", tags: "inverno,chuva" },
  { slug: "comunidade-entregadores-importancia", title: "Por Que Participar da Comunidade", desc: "Conecte-se com outros entregadores.", cat: "Comunidade", tags: "comunidade" },
  { slug: "programa-indicacao-meucorre", title: "Programa de Indicação do MeuCorre", desc: "Como ganhar indicando o app.", cat: "Dicas", tags: "indicação" },
  { slug: "historia-entregador-sucesso", title: "História: De Iniciante a 5 Estrelas", desc: "Inspiracão real.", cat: "Comunidade", tags: "história,sucesso" },
];

async function main() {
  const now = new Date();
  let created = 0;
  let updated = 0;

  for (let i = 0; i < TOPICS.length; i++) {
    const t = TOPICS[i];
    const publishedAt = new Date(now);
    publishedAt.setDate(publishedAt.getDate() + i - 89);

    const existing = await prisma.blogPost.findUnique({ where: { slug: t.slug } });

    if (existing) {
      await prisma.blogPost.update({
        where: { id: existing.id },
        data: {
          title: t.title,
          description: t.desc,
          content: generateContent(t.title, t.desc, t.cat),
          category: t.cat,
          tags: t.tags,
          published: true,
          publishedAt,
        },
      });
      updated++;
    } else {
      await prisma.blogPost.create({
        data: {
          slug: t.slug,
          title: t.title,
          description: t.desc,
          content: generateContent(t.title, t.desc, t.cat),
          category: t.cat,
          tags: t.tags,
          published: true,
          publishedAt,
        },
      });
      created++;
    }
  }

  console.log(`✅ ${created} criados, ${updated} atualizados. Total: ${await prisma.blogPost.count()}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
