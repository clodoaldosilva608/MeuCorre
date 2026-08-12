// ===== Seed: leads iniciais de Recife/PE para o CRM =====
//
// Cria parceiros em estágios variados do funil, todos em Recife/PE ou cidades
// próximas (Olinda, Jaboatão, Paulista), assignedTo='Clodoaldo Silva'.
//
// Categorias: serviços em geral do nicho (decisão #2) — oficinas, pneus,
// acessórios, alimentação, proteção, serviços.
//
// Idempotente: se já existir parceiro com mesmo CNPJ ou companyName+city, ignora.
//
// Uso:
//   DATABASE_URL=<supabase_url> DIRECT_URL=<supabase_url> npx tsx scripts/partners/seed-recife-pe.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["error", "warn"] });

interface SeedPartner {
  companyName: string;
  tradeName?: string;
  cnpj?: string;
  category: string;
  origin: string;
  city: string;
  state: string;
  address?: string;
  website?: string;
  phone: string;
  email: string;
  assignedTo: string;
  priority: "baixa" | "media" | "alta" | "urgente";
  status: "active" | "paused" | "archived" | "lost" | "disqualified";
  stage:
    | "novo_lead" | "qualificando" | "contato_iniciado" | "descoberta"
    | "proposta_enviada" | "negociacao" | "aguardando_aprovacao"
    | "ativacao" | "ativo" | "renovacao" | "perdido" | "desqualificado";
  relevanceScore?: number;
  benefitScore?: number;
  reputationScore?: number;
  capacityScore?: number;
  riskScore?: number;
  tags?: string;
  potentialValue?: number;
  notes?: string;
  contact?: {
    name: string;
    role?: string;
    phone?: string;
    email?: string;
    isPrimary?: boolean;
  };
}

// 22 leads iniciais cobrindo 10 estágios do funil
// Foco em serviços em geral do nicho (decisão #2) na região de Recife/PE (decisão #1)
const SEED_PARTNERS: SeedPartner[] = [
  // ===== NOVO LEAD (4) =====
  {
    companyName: "Oficina do Zé Mecânica Automotiva",
    tradeName: "Oficina do Zé",
    cnpj: "12.345.678/0001-01",
    category: "oficina",
    origin: "indicacao",
    city: "Recife",
    state: "PE",
    address: "Av. Boa Viagem, 4500 - Boa Viagem",
    phone: "(81) 99999-1001",
    email: "contato@oficinadoze.com.br",
    assignedTo: "Clodoaldo Silva",
    priority: "media",
    status: "active",
    stage: "novo_lead",
    tags: "recife,boaviagem,mecanica",
    potentialValue: 1200,
    notes: "Indicado por um entregador que usa o MeuCorre. Atende muitas motos de entregadores.",
    contact: { name: "José Silva", role: "Proprietário", phone: "(81) 99999-1001", email: "jose@oficinadoze.com.br", isPrimary: true },
  },
  {
    companyName: "Pneus & Rodas do Norte",
    tradeName: "Pneus do Norte",
    cnpj: "23.456.789/0001-02",
    category: "pneus",
    origin: "manual",
    city: "Olinda",
    state: "PE",
    address: "Rua do Sol, 123 - Casa Forte",
    phone: "(81) 98888-1002",
    email: "vendas@pneusdonorte.com.br",
    assignedTo: "Clodoaldo Silva",
    priority: "alta",
    status: "active",
    stage: "novo_lead",
    tags: "olinda,pneus,moto",
    potentialValue: 1800,
    notes: "Especializados em pneus de moto. Bairro com alto fluxo de entregadores.",
    contact: { name: "Carlos Mendes", role: "Gerente", phone: "(81) 98888-1002", isPrimary: true },
  },
  {
    companyName: "Acessórios Premium Moto Shop",
    category: "acessorios",
    origin: "form",
    city: "Jaboatão dos Guararapes",
    state: "PE",
    phone: "(81) 97777-1003",
    email: "contato@premiummoto.com.br",
    assignedTo: "Clodoaldo Silva",
    priority: "media",
    status: "active",
    stage: "novo_lead",
    tags: "jaboatao,acessorios,bauleto",
    potentialValue: 900,
    contact: { name: "Ana Paula", role: "Vendedora", phone: "(81) 97777-1003", isPrimary: true },
  },
  {
    companyName: "Lanchonete do Entregador",
    category: "alimentacao",
    origin: "manual",
    city: "Recife",
    state: "PE",
    address: "Praça do Derby, 45 - Derby",
    phone: "(81) 96666-1004",
    email: "lanchonete.entregador@gmail.com",
    assignedTo: "Clodoaldo Silva",
    priority: "baixa",
    status: "active",
    stage: "novo_lead",
    tags: "recife,derby,alimentacao",
    potentialValue: 500,
    notes: "Ponto de parada conhecido de entregadores. Poderia oferecer desconto.",
    contact: { name: "Seu Antônio", role: "Proprietário", phone: "(81) 96666-1004", isPrimary: true },
  },

  // ===== QUALIFICANDO (3) =====
  {
    companyName: "Auto Center São José",
    cnpj: "34.567.890/0001-03",
    category: "servicos",
    origin: "indicacao",
    city: "Paulista",
    state: "PE",
    address: "BR-101, Km 56 - Centro",
    phone: "(81) 95555-1005",
    email: "autocenter.saojose@hotmail.com",
    assignedTo: "Clodoaldo Silva",
    priority: "alta",
    status: "active",
    stage: "qualificando",
    relevanceScore: 75,
    benefitScore: 80,
    tags: "paulista,mecanica,eletrica",
    potentialValue: 2000,
    notes: "Fazem serviço elétrico e mecânico. Atendem frota de motos grande.",
    contact: { name: "Marcos Antônio", role: "Sócio-proprietário", phone: "(81) 95555-1005", isPrimary: true },
  },
  {
    companyName: "Bag Box & Cia",
    category: "acessorios",
    origin: "manual",
    city: "Recife",
    state: "PE",
    address: "Av. Dom Hélder Câmara, 2500 - Dois Irmãos",
    phone: "(81) 94444-1006",
    email: "bagbox.cia@gmail.com",
    assignedTo: "Clodoaldo Silva",
    priority: "urgente",
    status: "active",
    stage: "qualificando",
    relevanceScore: 90,
    benefitScore: 85,
    capacityScore: 70,
    tags: "recife,bauleto,protecao",
    potentialValue: 3500,
    notes: "Fábrica de baú para moto. Alto volume. Potencial alto.",
    contact: { name: "Roberto Carlos", role: "Diretor comercial", phone: "(81) 94444-1006", isPrimary: true },
  },
  {
    companyName: "Moto Protect PE",
    cnpj: "45.678.901/0001-04",
    category: "protecao",
    origin: "form",
    city: "Olinda",
    state: "PE",
    phone: "(81) 93333-1007",
    email: "contato@motoprotect.com.br",
    assignedTo: "Clodoaldo Silva",
    priority: "media",
    status: "active",
    stage: "qualificando",
    relevanceScore: 70,
    benefitScore: 75,
    tags: "olinda,rastreador,seguro",
    potentialValue: 1500,
    contact: { name: "Patrícia", role: "Atendimento", phone: "(81) 93333-1007", isPrimary: true },
  },

  // ===== CONTATO INICIADO (3) =====
  {
    companyName: "Rastreamento Brasil PE",
    cnpj: "56.789.012/0001-05",
    category: "protecao",
    origin: "indicacao",
    city: "Recife",
    state: "PE",
    address: "Rua Imperial, 1200 - São José",
    phone: "(81) 92222-1008",
    email: "comercial@rastreamentobrasil.com.br",
    assignedTo: "Clodoaldo Silva",
    priority: "alta",
    status: "active",
    stage: "contato_iniciado",
    relevanceScore: 85,
    benefitScore: 90,
    reputationScore: 80,
    tags: "recife,rastreador,antifurto",
    potentialValue: 3000,
    notes: "Primeiro contato feito via WhatsApp. Aguardando resposta para reunião.",
    contact: { name: "Felipe Souza", role: "Gerente comercial", phone: "(81) 92222-1008", isPrimary: true },
  },
  {
    companyName: "Mecânica Veloz Moto",
    category: "oficina",
    origin: "manual",
    city: "Recife",
    state: "PE",
    address: "Av. Caxangá, 800 - Iputinga",
    phone: "(81) 91111-1009",
    email: "velozmoto@outlook.com",
    assignedTo: "Clodoaldo Silva",
    priority: "media",
    status: "active",
    stage: "contato_iniciado",
    tags: "recife,iputinga,mecanica",
    potentialValue: 1000,
    contact: { name: "Wagner", role: "Proprietário", phone: "(81) 91111-1009", isPrimary: true },
  },
  {
    companyName: "Borracharia 24h Corre",
    category: "servicos",
    origin: "manual",
    city: "Jaboatão dos Guararapes",
    state: "PE",
    phone: "(81) 90000-1010",
    email: "borracharia24h.corre@gmail.com",
    assignedTo: "Clodoaldo Silva",
    priority: "alta",
    status: "active",
    stage: "contato_iniciado",
    tags: "jaboatao,borracharia,24h",
    potentialValue: 1200,
    notes: "Serviço de socorro para entregadores. Atende 24h.",
    contact: { name: "Pedro Henrique", role: "Sócio", phone: "(81) 90000-1010", isPrimary: true },
  },

  // ===== DESCOBERTA (2) =====
  {
    companyName: "Supermercado Bom Preço Entregas",
    cnpj: "67.890.123/0001-06",
    category: "alimentacao",
    origin: "manual",
    city: "Recife",
    state: "PE",
    address: "Av. Eng. Domingos Ferreira, 2000 - Boa Viagem",
    phone: "(81) 88888-1011",
    email: "marketing@bompreco.com.br",
    assignedTo: "Clodoaldo Silva",
    priority: "urgente",
    status: "active",
    stage: "descoberta",
    relevanceScore: 95,
    benefitScore: 90,
    reputationScore: 85,
    capacityScore: 95,
    tags: "recife,supermercado,grande-porte",
    potentialValue: 8000,
    notes: "Discutindo modelo de parceria: desconto para entregadores + exposição da marca.",
    contact: { name: "Juliana Castro", role: "Gerente de marketing", phone: "(81) 88888-1011", email: "juliana@bompreco.com.br", isPrimary: true },
  },
  {
    companyName: "Pastelaria do Comércio",
    category: "alimentacao",
    origin: "indicacao",
    city: "Olinda",
    state: "PE",
    phone: "(81) 87777-1012",
    email: "pastelariacomercio@gmail.com",
    assignedTo: "Clodoaldo Silva",
    priority: "media",
    status: "active",
    stage: "descoberta",
    tags: "olinda,pastel,comunidade",
    potentialValue: 700,
    contact: { name: "Dona Maria", role: "Proprietária", phone: "(81) 87777-1012", isPrimary: true },
  },

  // ===== PROPOSTA ENVIADA (2) =====
  {
    companyName: "Açaí & Cia Recife",
    cnpj: "78.901.234/0001-07",
    category: "alimentacao",
    origin: "manual",
    city: "Recife",
    state: "PE",
    address: "Rua dos Navegantes, 350 - Boa Viagem",
    phone: "(81) 86666-1013",
    email: "acaicia.recife@gmail.com",
    assignedTo: "Clodoaldo Silva",
    priority: "alta",
    status: "active",
    stage: "proposta_enviada",
    relevanceScore: 80,
    benefitScore: 85,
    tags: "recife,acai,desconto",
    potentialValue: 1500,
    notes: "Proposta enviada: cobrança por campanha (R$ 1500/mês) + por lead (R$ 5/lead). Aguardando retorno.",
    contact: { name: "Rafael Lima", role: "Proprietário", phone: "(81) 86666-1013", isPrimary: true },
  },
  {
    companyName: "Moto Peças Centro",
    category: "servicos",
    origin: "indicacao",
    city: "Recife",
    state: "PE",
    address: "Rua da Madalena, 100 - Madalena",
    phone: "(81) 85555-1014",
    email: "motopecascentro@uol.com.br",
    assignedTo: "Clodoaldo Silva",
    priority: "media",
    status: "active",
    stage: "proposta_enviada",
    tags: "recife,madalenha,pecas",
    potentialValue: 1100,
    contact: { name: "Tânia", role: "Gerente", phone: "(81) 85555-1014", isPrimary: true },
  },

  // ===== NEGOCIAÇÃO (2) =====
  {
    companyName: "Pizza Express do Bairro",
    cnpj: "89.012.345/0001-08",
    category: "alimentacao",
    origin: "form",
    city: "Recife",
    state: "PE",
    phone: "(81) 84444-1015",
    email: "pizzaexpress.bairro@gmail.com",
    assignedTo: "Clodoaldo Silva",
    priority: "alta",
    status: "active",
    stage: "negociacao",
    relevanceScore: 85,
    benefitScore: 88,
    reputationScore: 75,
    tags: "recife,pizza,delivery",
    potentialValue: 2200,
    notes: "Negociando modelo: ambos (campanha + lead). Cliente quer desconto de 10% para entregadores.",
    contact: { name: "Eduardo", role: "Sócio", phone: "(81) 84444-1015", isPrimary: true },
  },
  {
    companyName: "Auto Elétrica Silva",
    category: "servicos",
    origin: "manual",
    city: "Paulista",
    state: "PE",
    phone: "(81) 83333-1016",
    email: "autoeletrica.silva@hotmail.com",
    assignedTo: "Clodoaldo Silva",
    priority: "media",
    status: "active",
    stage: "negociacao",
    tags: "paulista,eletrica,bateria",
    potentialValue: 1300,
    contact: { name: "Sérgio Silva", role: "Proprietário", phone: "(81) 83333-1016", isPrimary: true },
  },

  // ===== ATIVO (3) =====
  {
    companyName: "Hamburgueria Corre Duro",
    cnpj: "90.123.456/0001-09",
    category: "alimentacao",
    origin: "indicacao",
    city: "Recife",
    state: "PE",
    address: "Rua Carneiro Vilela, 500 - Tejipió",
    phone: "(81) 82222-1017",
    email: "correduro.burger@gmail.com",
    assignedTo: "Clodoaldo Silva",
    priority: "alta",
    status: "active",
    stage: "ativo",
    relevanceScore: 90,
    benefitScore: 92,
    reputationScore: 88,
    capacityScore: 80,
    tags: "recife,hamburguer,ativo",
    potentialValue: 2500,
    notes: "Parceiro ativo desde 2026-07. Oferece 15% de desconto para entregadores MeuCorre. Campanha mensal R$ 2000 + R$ 5/lead.",
    contact: { name: "Marcelo", role: "Proprietário", phone: "(81) 82222-1017", isPrimary: true },
  },
  {
    companyName: "Oficina Moto Segura",
    cnpj: "01.234.567/0001-10",
    category: "oficina",
    origin: "manual",
    city: "Olinda",
    state: "PE",
    phone: "(81) 81111-1018",
    email: "motosegura.oficina@gmail.com",
    assignedTo: "Clodoaldo Silva",
    priority: "alta",
    status: "active",
    stage: "ativo",
    relevanceScore: 88,
    benefitScore: 90,
    tags: "olinda,oficina,ativo",
    potentialValue: 1800,
    notes: "Ativo desde 2026-06. Revisão com 20% de desconto para entregadores.",
    contact: { name: "Cláudio", role: "Mecânico chefe", phone: "(81) 81111-1018", isPrimary: true },
  },
  {
    companyName: "Borracharia Sempre Na Hora",
    category: "servicos",
    origin: "indicacao",
    city: "Jaboatão dos Guararapes",
    state: "PE",
    phone: "(81) 80000-1019",
    email: "semprenahora.borracharia@gmail.com",
    assignedTo: "Clodoaldo Silva",
    priority: "media",
    status: "active",
    stage: "ativo",
    tags: "jaboatao,borracharia,ativo",
    potentialValue: 800,
    notes: "Ativo desde 2026-07. Cupom de troca de pneu com 10% desconto.",
    contact: { name: "Igor", role: "Proprietário", phone: "(81) 80000-1019", isPrimary: true },
  },

  // ===== RENOVAÇÃO (1) =====
  {
    companyName: "Lava Jato do Entregador",
    cnpj: "12.345.678/0002-11",
    category: "servicos",
    origin: "manual",
    city: "Recife",
    state: "PE",
    address: "Av. Mascarenhas de Morais, 1200 - Imbiribeira",
    phone: "(81) 79999-1020",
    email: "lavajato.entregador@gmail.com",
    assignedTo: "Clodoaldo Silva",
    priority: "alta",
    status: "active",
    stage: "renovacao",
    relevanceScore: 75,
    benefitScore: 80,
    reputationScore: 70,
    tags: "recife,lavajato,renovacao",
    potentialValue: 1000,
    notes: "Contrato vence em 30 dias. Cliente quer renegociar valor (pede R$ 800/mês).",
    contact: { name: "Paulo", role: "Proprietário", phone: "(81) 79999-1020", isPrimary: true },
  },

  // ===== PERDIDO (1) =====
  {
    companyName: "Comida Boa Delivery",
    category: "alimentacao",
    origin: "manual",
    city: "Recife",
    state: "PE",
    phone: "(81) 78888-1021",
    email: "comidaboadelivery@outlook.com",
    assignedTo: "Clodoaldo Silva",
    priority: "baixa",
    status: "lost",
    stage: "perdido",
    tags: "recife,perdido",
    potentialValue: 0,
    notes: "Perdido: cliente achou caro. Preferiu outro app de fidelidade.",
    contact: { name: "Fernanda", role: "Proprietária", phone: "(81) 78888-1021", isPrimary: true },
  },

  // ===== DESQUALIFICADO (1) =====
  {
    companyName: "Bar do Zé Bebidas",
    category: "alimentacao",
    origin: "manual",
    city: "Recife",
    state: "PE",
    phone: "(81) 77777-1022",
    email: "bardoze@gmail.com",
    assignedTo: "Clodoaldo Silva",
    priority: "baixa",
    status: "disqualified",
    stage: "desqualificado",
    tags: "recife,desqualificado",
    notes: "Desqualificado: não atende entregadores, foco em público noturno.",
    contact: { name: "Zé", role: "Proprietário", phone: "(81) 77777-1022", isPrimary: true },
  },
];

async function main() {
  console.log(`🌱 Iniciando seed de ${SEED_PARTNERS.length} parceiros...`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const seed of SEED_PARTNERS) {
    try {
      // Verifica duplicação por CNPJ
      if (seed.cnpj) {
        const cnpjDigits = seed.cnpj.replace(/\D/g, "");
        const existing = await prisma.partner.findUnique({
          where: { cnpj: cnpjDigits },
        });
        if (existing) {
          console.log(`   ♻️  ${seed.companyName} — já existe (CNPJ)`);
          skipped++;
          continue;
        }
      }

      // Verifica duplicação por companyName + city (case-insensitive)
      const existingByName = await prisma.partner.findFirst({
        where: {
          companyName: { equals: seed.companyName, mode: "insensitive" },
          city: { equals: seed.city, mode: "insensitive" },
        },
      });
      if (existingByName) {
        console.log(`   ♻️  ${seed.companyName} — já existe (nome+cidade)`);
        skipped++;
        continue;
      }

      // Cria parceiro
      const partner = await prisma.partner.create({
        data: {
          companyName: seed.companyName,
          tradeName: seed.tradeName ?? null,
          cnpj: seed.cnpj ? seed.cnpj.replace(/\D/g, "") : null,
          category: seed.category,
          origin: seed.origin,
          city: seed.city,
          state: seed.state,
          address: seed.address ?? null,
          website: seed.website ?? null,
          phone: seed.phone,
          email: seed.email,
          assignedTo: seed.assignedTo,
          priority: seed.priority,
          status: seed.status,
          stage: seed.stage,
          relevanceScore: seed.relevanceScore ?? null,
          benefitScore: seed.benefitScore ?? null,
          reputationScore: seed.reputationScore ?? null,
          capacityScore: seed.capacityScore ?? null,
          riskScore: seed.riskScore ?? null,
          tags: seed.tags ?? null,
          potentialValue: seed.potentialValue ?? null,
          notes: seed.notes ?? null,
        },
      });

      // Cria contato principal se informado
      if (seed.contact) {
        await prisma.partnerContact.create({
          data: {
            partnerId: partner.id,
            name: seed.contact.name,
            role: seed.contact.role ?? null,
            email: seed.contact.email ?? null,
            phone: seed.contact.phone ?? null,
            isPrimary: seed.contact.isPrimary ?? true,
            optOut: false,
          },
        });
      }

      // Cria log de auditoria
      await prisma.partnerLog.create({
        data: {
          partnerId: partner.id,
          action: "created",
          details: JSON.stringify({
            source: "seed_recife_pe",
            stage: seed.stage,
            category: seed.category,
            city: seed.city,
          }),
          adminEmail: "system@meucorre.com.br",
        },
      });

      console.log(`   ➕ ${seed.companyName} (${seed.city}/${seed.state}) — ${seed.stage}`);
      created++;
    } catch (err) {
      console.error(
        `   ❌ ${seed.companyName}:`,
        err instanceof Error ? err.message : String(err),
      );
      errors++;
    }
  }

  // Relatório
  const totalPartners = await prisma.partner.count();
  const totalContacts = await prisma.partnerContact.count();
  const byStage = await prisma.partner.groupBy({ by: ["stage"], _count: true });

  console.log("\n" + "=".repeat(60));
  console.log("📊 RELATÓRIO DE SEED");
  console.log("=".repeat(60));
  console.log(`Criados: ${created}`);
  console.log(`Skipped (já existiam): ${skipped}`);
  console.log(`Erros: ${errors}`);
  console.log(`\nTotal de parceiros no banco: ${totalPartners}`);
  console.log(`Total de contatos: ${totalContacts}`);
  console.log("\nDistribuição por estágio:");
  for (const { stage, _count } of byStage) {
    console.log(`  ${stage}: ${_count}`);
  }
  console.log("=".repeat(60));
}

main()
  .catch((e) => {
    console.error("💥 Erro fatal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
