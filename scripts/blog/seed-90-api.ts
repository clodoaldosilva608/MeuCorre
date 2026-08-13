const BASE_URL = "https://meucorre.vercel.app";

async function login() {
  const res = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "clodoaldo608@gmail.com", password: "Silva88677488@#" }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  return setCookie.map((c: string) => c.split(";")[0]).join("; ");
}

function generateContent(title: string, desc: string, cat: string): string {
  return `# ${title}\n\n${desc}\n\n## Introdução\n\nSer entregador de aplicativo exige organização. Neste artigo sobre **${cat.toLowerCase()}**, vamos ajudar você a maximizar ganhos e minimizar custos.\n\n## Por que isso importa?\n\nO MeuCorre ajuda nessa gestão — controle de corridas, despesas e visualização do lucro líquido real, mesmo offline.\n\n## Dicas práticas\n\n### 1. Organização é tudo\n\nRegistre diariamente corridas e despesas no MeuCorre.\n\n### 2. Conheça seus custos\n\nSaiba quanto gasta em gasolina, manutenção e alimentação.\n\n### 3. Trabalhe nos horários certos\n\n- Almoço: 11h às 14h\n- Jantar: 18h às 22h\n\n### 4. Mantenha sua moto em dia\n\nManutenção preventiva é mais barata.\n\n## Conclusão\n\n${desc} Baixe o MeuCorre: https://meucorre.vercel.app`;
}

const TOPICS = [
  { slug: "calcular-lucro-real-entregador", title: "Como Calcular o Lucro Real Como Entregador de App", desc: "Aprenda a diferença entre faturamento e lucro líquido.", cat: "Finanças", tags: "lucro,faturamento,despesas" },
  { slug: "planejamento-financeiro-motoboys", title: "Planejamento Financeiro para Motoboys: Guia Completo 2026", desc: "Aprenda a fazer orçamento e reserva de emergência.", cat: "Finanças", tags: "planejamento,orçamento" },
  { slug: "manutencao-moto-entregadores", title: "Manutenção da Moto para Entregadores: Checklist Completo", desc: "Guia de manutenção preventiva.", cat: "Moto", tags: "manutenção,moto" },
  { slug: "economizar-combustivel-entregador", title: "Como Economizar Combustível Sendo Entregador", desc: "Técnicas para reduzir gasto de gasolina.", cat: "Economia", tags: "combustível,economia" },
  { slug: "melhores-horarios-zonas-entregar", title: "Melhores Horários e Zonas para Entregar", desc: "Maximize seus ganhos.", cat: "Estratégia", tags: "horários,zonas" },
  { slug: "equipamentos-essenciais-entregadores", title: "Equipamentos Essenciais para Entregadores de App", desc: "Lista de equipamentos necessários.", cat: "Equipamentos", tags: "equipamentos,bau" },
  { slug: "gestao-tempo-entregadores", title: "Gestão de Tempo para Entregadores", desc: "Otimize rotas e pausas.", cat: "Produtividade", tags: "tempo,rotas" },
  { slug: "declaracao-imposto-renda-entregadores-2026", title: "Declaração de Imposto de Renda para Entregadores 2026", desc: "Guia sobre IRPF e MEI.", cat: "Impostos", tags: "imposto,renda,mei" },
  { slug: "qual-app-entrega-da-mais-dinheiro-2026", title: "Qual App de Entrega Dá Mais Dinheiro?", desc: "Comparativo entre apps.", cat: "Comparativo", tags: "comparativo,apps" },
  { slug: "entregador-5-estrelas-todos-apps", title: "Como Se Tornar um Entregador 5 Estrelas", desc: "Dicas para avaliações máximas.", cat: "Dicas", tags: "avaliação,5-estrelas" },
  { slug: "como-se-tornar-mei-entregador", title: "Como se Tornar MEI Sendo Entregador", desc: "Guia para abrir MEI.", cat: "Finanças", tags: "mei,cnpj" },
  { slug: "seguro-para-moto-entregador", title: "Seguro para Moto de Entregador: Vale a Pena?", desc: "Tipos e custos.", cat: "Seguro", tags: "seguro,moto" },
  { slug: "calculo-km-por-litro-entregador", title: "Como Calcular KM por Litro e Custo por Corrida", desc: "Saiba quanto sua moto gasta.", cat: "Finanças", tags: "km,combustível" },
  { slug: "rotas-mais-rentaveis-entrega", title: "Rotas Mais Renteis: Como Escolher", desc: "Aceite apenas entregas que valem a pena.", cat: "Estratégia", tags: "rotas,rentabilidade" },
  { slug: "bau-termico-vs-mochila", title: "Baú Térmico vs Mochila: Qual Escolher?", desc: "Comparativo.", cat: "Equipamentos", tags: "baú,mochila" },
  { slug: "como-lidar-clientes-dificeis", title: "Como Lidar com Clientes Difíceis", desc: "Mantenha 5 estrelas.", cat: "Dicas", tags: "clientes,avaliação" },
  { slug: "reserva-emergencia-entregador", title: "Reserva de Emergência: Quanto Guardar", desc: "Crie reserva para imprevistos.", cat: "Finanças", tags: "reserva,emergência" },
  { slug: "pneus-moto-entregador", title: "Pneus para Moto: Quando Trocar", desc: "Durabilidade e custo-benefício.", cat: "Moto", tags: "pneus,troca" },
  { slug: "trabalhar-fins-semana-vale", title: "Trabalhar aos Fins de Semana Vale a Pena?", desc: "Comparativo de ganhos.", cat: "Estratégia", tags: "fim-de-semana" },
  { slug: "organizar-corridas-por-app", title: "Como Organizar Corridas por App", desc: "Múltiplos apps sem confusão.", cat: "Produtividade", tags: "organização,apps" },
  { slug: "calibrar-pneus-moto-entregador", title: "Como Calibrar Pneus: Economize Combustível", desc: "Calibragem certa economiza.", cat: "Moto", tags: "calibragem,pneus" },
  { slug: "descontos-parceiros-entregador", title: "Descontos para Entregadores: Onde Economizar", desc: "Lista de descontos.", cat: "Economia", tags: "descontos,parceiros" },
  { slug: "meta-diaria-ganhos-entregador", title: "Como Definir Meta Diária de Ganhos", desc: "Metas realistas.", cat: "Finanças", tags: "metas,ganhos" },
  { slug: "troca-oleo-moto-entregador", title: "Troca de Óleo: Quando Fazer", desc: "Guia sobre troca de óleo.", cat: "Moto", tags: "óleo,troca" },
  { slug: "como-evitar-multas-transito", title: "Como Evitar Multas de Trânsito", desc: "Proteja sua CNH.", cat: "Dicas", tags: "multas,cnh" },
  { slug: "app-meucorre-funciona-offline", title: "MeuCorre Funciona Offline?", desc: "Guarde dados sem internet.", cat: "Dicas", tags: "offline,pwa" },
  { slug: "beneficios-ser-mei-entregador", title: "Benefícios de Ser MEI como Entregador", desc: "INSS e aposentadoria.", cat: "Finanças", tags: "mei,inss" },
  { slug: "compartilhar-ganhos-colegas", title: "Por Que Compartilhar Ganhos com Colegas", desc: "Troca de experiências.", cat: "Comunidade", tags: "comunidade" },
  { slug: "melhores-bairros-entregar-sao-paulo", title: "Melhores Bairros para Entregar em São Paulo", desc: "Análise de rentabilidade.", cat: "Estratégia", tags: "são-paulo" },
  { slug: "melhores-bairros-entregar-recife", title: "Melhores Bairros para Entregar no Recife", desc: "Análise de rentabilidade.", cat: "Estratégia", tags: "recife" },
  { slug: "melhores-bairros-entregar-rio", title: "Melhores Bairros para Entregar no Rio", desc: "Análise de rentabilidade.", cat: "Estratégia", tags: "rio" },
  { slug: "economizar-alimentacao-entregador", title: "Como Economizar em Alimentação", desc: "Coma bem gastando pouco.", cat: "Economia", tags: "alimentação" },
  { slug: "capacete-entregador-importancia", title: "Capacete de Entregador: Segurança e Conforto", desc: "Importância de um bom capacete.", cat: "Equipamentos", tags: "capacete" },
  { slug: "luvas-jaqueta-chuva-entregador", title: "Luvas, Jaqueta e Capa de Chuva", desc: "Proteção para todas as condições.", cat: "Equipamentos", tags: "luvas,chuva" },
  { slug: "como-funciona-pagamento-ifood", title: "Como Funciona o Pagamento do iFood", desc: "Sistema de pagamentos.", cat: "Finanças", tags: "ifood" },
  { slug: "como-funciona-pagamento-rappi", title: "Como Funciona o Pagamento da Rappi", desc: "Sistema de pagamentos.", cat: "Finanças", tags: "rappi" },
  { slug: "ferramenta-multiplataforma-entregas", title: "Por Que Usar Ferramenta Multiplataforma", desc: "Vantagens do MeuCorre.", cat: "Produtividade", tags: "meucorre" },
  { slug: "custo-manutencao-moto-mes", title: "Custo de Manutenção da Moto por Mês", desc: "Calcule quanto custa.", cat: "Finanças", tags: "manutenção,custo" },
  { slug: "depreciacao-moto-entregador", title: "Depreciação da Moto: O Custo Invisível", desc: "Como afeta o lucro.", cat: "Finanças", tags: "depreciação" },
  { slug: "como-controlar-quilometragem", title: "Como Controlar a Quilometragem", desc: "Registre km rodados.", cat: "Produtividade", tags: "quilometragem" },
  { slug: "trabalhar-noite-entregador-seguranca", title: "Trabalhar à Noite: Dicas de Segurança", desc: "Segurança nas entregas noturnas.", cat: "Dicas", tags: "noite,segurança" },
  { slug: "pavio-vela-moto-entregador", title: "Pavio e Vela: Quando Trocar", desc: "Manutenção esquecida.", cat: "Moto", tags: "pavio,vela" },
  { slug: "frenagem-moto-entregador-pastilhas", title: "Pastilhas de Freio: Quando Trocar", desc: "Sinais de desgaste.", cat: "Moto", tags: "freio,pastilhas" },
  { slug: "como-organizar-bau-moto", title: "Como Organizar o Baú da Moto", desc: "Evite atrasos e danos.", cat: "Produtividade", tags: "baú,organização" },
  { slug: "comissao-app-entrega-entenda", title: "Comissão dos Apps: Quanto Eles Levam", desc: "Análise de taxas.", cat: "Finanças", tags: "comissão,taxas" },
  { slug: "gorjetas-entregador-como-conseguir", title: "Gorjetas: Como Conseguir Mais", desc: "Aumente gorjetas.", cat: "Dicas", tags: "gorjetas" },
  { slug: "trabalhar-chuva-entregador-dicas", title: "Trabalhar na Chuva: Dicas", desc: "Preparação e segurança.", cat: "Dicas", tags: "chuva" },
  { slug: "como-renovar-cnh-entregador", title: "Como Renovar a CNH", desc: "Prazos e custos.", cat: "Dicas", tags: "cnh,renovação" },
  { slug: "combustivel-etanol-gasolina-moto", title: "Etanol ou Gasolina: Qual Compensa?", desc: "Comparativo.", cat: "Economia", tags: "etanol,gasolina" },
  { slug: "app-rastreador-moto-entregador", title: "Rastreador para Moto: Vale a Pena?", desc: "Análise de rastreadores.", cat: "Seguro", tags: "rastreador" },
  { slug: "como-cobrir-corridas-colegas", title: "Como Cobrir Corridas de Colegas", desc: "Ajude sem se prejudicar.", cat: "Comunidade", tags: "colegas" },
  { slug: "estrategia-aceitar-recusar-corridas", title: "Quando Aceitar e Recusar Corridas", desc: "Maximize lucro.", cat: "Estratégia", tags: "aceitar,recusar" },
  { slug: "mapa-calor-zonas-entrega", title: "Mapa de Calor: Zonas Rentáveis", desc: "Use o mapa do MeuCorre.", cat: "Estratégia", tags: "mapa,calor" },
  { slug: "investir-lucro-entregador", title: "Como Investir o Lucro", desc: "Faça o dinheiro render.", cat: "Finanças", tags: "investir" },
  { slug: "corrida-do-dia-gps-meucorre", title: "Corre do Dia: Como o GPS Ajuda", desc: "Cronômetro e GPS.", cat: "Dicas", tags: "gps,corre-do-dia" },
  { slug: "como-pedir-aumento-taxa-app", title: "Como Negociar Melhores Taxas", desc: "Dicas de negociação.", cat: "Finanças", tags: "negociação" },
  { slug: "primeiros-passos-entregador-app", title: "Primeiros Passos como Entregador", desc: "Guia do iniciante.", cat: "Dicas", tags: "iniciante" },
  { slug: "erros-comuns-entregadores-iniciantes", title: "7 Erros Comuns de Iniciantes", desc: "Erros que custam dinheiro.", cat: "Dicas", tags: "erros" },
  { slug: "como-manter-moto-limpa-entregador", title: "Como Manter a Moto Limpa", desc: "Limpeza e conservação.", cat: "Moto", tags: "limpeza" },
  { slug: "alimentacao-saudavel-entregador-rua", title: "Alimentação Saudável na Rua", desc: "Coma bem gastando pouco.", cat: "Saúde", tags: "alimentação,saúde" },
  { slug: "postura-corpo-entregador-moto", title: "Postura e Saúde: Proteja o Corpo", desc: "Evite dores nas costas.", cat: "Saúde", tags: "postura" },
  { slug: "como-lidar-com-stress-entregador", title: "Como Lidar com o Stress", desc: "Saúde mental.", cat: "Saúde", tags: "stress" },
  { slug: "auxilio-doenca-mei-entregador", title: "Auxílio-Doença MEI: Como Funciona", desc: "Receba auxílio.", cat: "Finanças", tags: "auxílio,mei" },
  { slug: "aposentadoria-entregador-mei", title: "Aposentadoria do Entregador MEI", desc: "Como se preparar.", cat: "Finanças", tags: "aposentadoria" },
  { slug: "como-fazer-orcamento-mensal-entregador", title: "Como Fazer Orçamento Mensal", desc: "Passo a passo.", cat: "Finanças", tags: "orçamento" },
  { slug: "dividir-ganhos-por-app-analise", title: "Como Dividir Ganhos por App", desc: "Análise de rentabilidade.", cat: "Finanças", tags: "análise,apps" },
  { slug: "custo-por-km-rodado-moto", title: "Custo por KM Rodado: Como Calcular", desc: "Fórmula completa.", cat: "Finanças", tags: "custo,km" },
  { slug: "bateria-moto-entregador-cuidados", title: "Bateria da Moto: Cuidados", desc: "Prolongue a vida útil.", cat: "Moto", tags: "bateria" },
  { slug: "corrente-moto-troca-entregador", title: "Corrente da Moto: Quando Trocar", desc: "Manutenção da corrente.", cat: "Moto", tags: "corrente" },
  { slug: "como-escolher-moto-entrega", title: "Como Escolher a Moto Ideal", desc: "Critérios de escolha.", cat: "Equipamentos", tags: "moto,escolha" },
  { slug: "ifood-vs-99food-comparativo", title: "iFood vs 99Food: Qual Paga Mais?", desc: "Comparativo.", cat: "Comparativo", tags: "ifood,99food" },
  { slug: "lalamove-vs-rappi-comparativo", title: "Lalamove vs Rappi: Qual é Melhor?", desc: "Ganhos e taxas.", cat: "Comparativo", tags: "lalamove,rappi" },
  { slug: "trabalhar-cidade-pequena-entrega", title: "Entregar em Cidade Pequena Vale a Pena?", desc: "Viabilidade.", cat: "Estratégia", tags: "cidade-pequena" },
  { slug: "como-migrar-uber-entregador", title: "Como Migrar de Uber para Entregador", desc: "Guia para motoristas.", cat: "Dicas", tags: "uber,migração" },
  { slug: "melhores-cidades-entregar-brasil", title: "Melhores Cidades para Entregar em 2026", desc: "Ranking.", cat: "Estratégia", tags: "cidades" },
  { slug: "picpay-mercadopago-entregador", title: "PicPay vs Mercado Pago: Qual Usar?", desc: "Contas digitais.", cat: "Finanças", tags: "picpay,mercadopago" },
  { slug: "como-declarar-ganhos-entregador", title: "Como Declarar Ganhos no IR", desc: "Declaração de ganhos.", cat: "Impostos", tags: "declaração,ir" },
  { slug: "notas-fiscais-entregador-mei", title: "Notas Fiscais para Entregador MEI", desc: "Como emitir.", cat: "Finanças", tags: "notas,mei" },
  { slug: "como-funciona-avaliacao-entregador", title: "Como Funciona a Avaliação nos Apps", desc: "Sistema de avaliação.", cat: "Dicas", tags: "avaliação" },
  { slug: "dicas-pontualidade-entregador", title: "Dicas de Pontualidade: Nunca Atrase", desc: "Seja pontual.", cat: "Dicas", tags: "pontualidade" },
  { slug: "como-lidar-com-cancellation", title: "Como Lidar com Cancelamentos", desc: "Proteja-se.", cat: "Dicas", tags: "cancelamento" },
  { slug: "seguro-vida-entregador", title: "Seguro de Vida para Entregadores", desc: "Vale a pena?", cat: "Seguro", tags: "seguro-vida" },
  { slug: "como-economizar-bateria-celular", title: "Como Economizar Bateria do Celular", desc: "Dura o dia todo.", cat: "Dicas", tags: "bateria" },
  { slug: "plano-dados-celular-entregador", title: "Melhor Plano de Dados para Entregadores", desc: "Quanto de internet.", cat: "Economia", tags: "dados,internet" },
  { slug: "como-trabalhar-feriados-entregador", title: "Trabalhar em Feriados Vale a Pena?", desc: "Análise de ganhos.", cat: "Estratégia", tags: "feriados" },
  { slug: "como-preparar-moto-verao", title: "Como Preparar a Moto para o Verão", desc: "Cuidados com calor.", cat: "Moto", tags: "verão" },
  { slug: "como-preparar-moto-inverno", title: "Como Preparar a Moto para o Inverno", desc: "Cuidados com frio.", cat: "Moto", tags: "inverno" },
  { slug: "comunidade-entregadores-importancia", title: "Por Que Participar da Comunidade", desc: "Conecte-se.", cat: "Comunidade", tags: "comunidade" },
  { slug: "programa-indicacao-meucorre", title: "Programa de Indicação do MeuCorre", desc: "Como ganhar indicando.", cat: "Dicas", tags: "indicação" },
  { slug: "historia-entregador-sucesso", title: "História: De Iniciante a 5 Estrelas", desc: "Inspiracão real.", cat: "Comunidade", tags: "história" },
];

async function main() {
  const cookie = await login();
  console.log(`✅ Login — ${TOPICS.length} posts para criar`);

  let created = 0, updated = 0;
  const now = new Date();

  for (let i = 0; i < TOPICS.length; i++) {
    const t = TOPICS[i];
    const publishedAt = new Date(now);
    publishedAt.setDate(publishedAt.getDate() + i - 89);

    const body = {
      slug: t.slug,
      title: t.title,
      description: t.desc,
      content: generateContent(t.title, t.desc, t.cat),
      category: t.cat,
      tags: t.tags,
      published: true,
      publishedAt: publishedAt.toISOString(),
    };

    const res = await fetch(`${BASE_URL}/api/admin/blog`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      created++;
      process.stdout.write(".");
    } else if (res.status === 409) {
      // Já existe — tenta atualizar
      const res2 = await fetch(`${BASE_URL}/api/admin/blog`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: cookie },
        body: JSON.stringify(body),
      });
      if (res2.ok) updated++;
      process.stdout.write("u");
    } else {
      process.stdout.write("x");
    }

    if ((i + 1) % 10 === 0) process.stdout.write(`\n${i + 1}/${TOPICS.length} `);
  }

  console.log(`\n\n✅ ${created} criados, ${updated} atualizados`);

  // Verifica
  const checkRes = await fetch(`${BASE_URL}/api/admin/blog`, { headers: { Cookie: cookie } });
  const checkData = await checkRes.json();
  console.log(`📊 Total no banco: ${checkData.posts?.length ?? 0}`);
}

main().catch(console.error);
