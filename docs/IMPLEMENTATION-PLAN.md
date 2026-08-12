# Plano de Implementação — MeuCorre Enterprise

> Análise consolidada baseada em:
> - Manus: "Análise e Aperfeiçoamento da Operação Outbound do MeuCorre" (24KB)
> - Documentação LEAD-GENERATION-STRATEGY.md (análise validasaas + onya)
> - Estado atual do projeto (dashboard premium, quiz, corre do dia, metas, mapa de calor)
> - Schema Prisma atual (Lead, BlogPost, Offer, Referral, AdminUser, etc.)

---

## 📊 Estado Atual (já implementado)

| Funcionalidade | Status | Observação |
|---------------|--------|------------|
| Landing page premium | ✅ Deploy | Dark glassmorphism, capacetes F1 |
| Quiz de captação + criação de conta | ✅ Deploy | 4 perguntas → trial 14 dias |
| Dashboard premium | ✅ Deploy | Hero card lucro + grid 2x2 |
| Corre do dia (cronômetro + GPS) | ✅ Deploy | Persiste em background |
| Metas diárias/semanais/mensais | ✅ Deploy | Barra de progresso |
| Mapa de calor | ✅ Deploy | Leaflet + OpenStreetMap |
| Onboarding tutorial | ✅ Deploy | 9 passos |
| Blog interno + Blogger | ✅ Deploy | OAuth2 + refresh automático |
| Programa de indicação | ✅ Deploy | R$ 5 por amigo PRO |
| Admin panel | ✅ Deploy | Users, ads, offers, blog, referrals |
| Auth (login/registro/trial) | ✅ Deploy | JWT + cookie httpOnly |
| Sync entre dispositivos | ✅ Deploy | Corridas + despesas |
| PWA install | ✅ Deploy | Install popup + manifest |

---

## 🗺️ Plano de Implementação em Fases

### FASE 1 — Central de Parceiros B2B (2 semanas)

**Objetivo:** Criar CRM de parceiros comerciais para captar empresas que oferecem benefícios aos entregadores (oficinas, pneus, alimentação, etc.)

#### 1.1 Schema do banco (3 dias)

```prisma
model Partner {
  id              String   @id @default(cuid())
  companyName     String
  tradeName       String?
  cnpj            String?  @unique
  category        String   // oficina | pneus | acessorios | alimentacao | protecao | outros
  city            String
  state           String
  address         String?
  website         String?
  logoUrl         String?
  description     String?
  status          String   @default("lead") // lead | contacted | proposed | active | inactive | rejected
  assignedTo      String?  // responsável comercial
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  contacts        PartnerContact[]
  opportunities   Opportunity[]
  campaigns       Campaign[]

  @@index([status])
  @@index([category])
  @@index([city, state])
}

model PartnerContact {
  id          String   @id @default(cuid())
  partnerId   String
  name        String
  role        String?  // cargo
  email       String?
  phone       String?
  linkedin    String?
  isPrimary   Boolean  @default(false)
  optOut      Boolean  @default(false) // respeitar opt-out
  createdAt   DateTime @default(now())

  partner     Partner  @relation(fields: [partnerId], references: [id], onDelete: Cascade)

  @@index([partnerId])
}

model Opportunity {
  id          String   @id @default(cuid())
  partnerId   String
  title       String
  stage       String   @default("discovery") // discovery | qualified | proposed | negotiated | closed_won | closed_lost
  value       Decimal? @db.Decimal(10, 2) // valor mensal estimado
  model       String?  // mensalidade | campanha | lead | comissao
  notes       String?
  expectedCloseDate DateTime?
  closedAt    DateTime?
  closedReason String? // motivo de perda
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  partner     Partner  @relation(fields: [partnerId], references: [id], onDelete: Cascade)

  @@index([partnerId, stage])
  @@index([stage])
}

model Campaign {
  id          String   @id @default(cuid())
  partnerId   String
  title       String
  description String
  offerType   String   // cupom | cashback | desconto | frete_gratis
  offerValue  String   // "10% OFF" | "Frete grátis" | etc
  couponCode  String?  @unique
  ctaText     String   @default("Aproveitar oferta")
  ctaUrl      String?
  startsAt    DateTime
  endsAt      DateTime?
  status      String   @default("draft") // draft | pending_approval | approved | active | paused | expired
  clicks      Int      @default(0)
  redemptions Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  partner     Partner  @relation(fields: [partnerId], references: [id], onDelete: Cascade)

  @@index([partnerId, status])
  @@index([status, startsAt])
}

model PartnerLog {
  id          String   @id @default(cuid())
  partnerId   String
  action      String   // created | contacted | emailed | called | meeting | proposal_sent | status_changed
  details     String?  // JSON com detalhes
  adminId     String?
  adminEmail  String?
  createdAt   DateTime @default(now())

  @@index([partnerId, createdAt])
}
```

#### 1.2 APIs (4 dias)

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/admin/partners` | GET | Lista parceiros com filtros |
| `/api/admin/partners` | POST | Cria novo parceiro |
| `/api/admin/partners/[id]` | GET | Detalhes do parceiro |
| `/api/admin/partners/[id]` | PATCH | Atualiza parceiro |
| `/api/admin/partners/[id]` | DELETE | Remove parceiro |
| `/api/admin/partners/[id]/contacts` | POST | Adiciona contato |
| `/api/admin/partners/[id]/opportunities` | POST | Cria oportunidade |
| `/api/admin/partners/[id]/campaigns` | POST | Cria campanha |
| `/api/admin/partners/[id]/logs` | GET | Histórico de ações |
| `/api/admin/campaigns/[id]/approve` | POST | Aprova campanha |
| `/api/admin/campaigns/[id]/pause` | POST | Pausa campanha |

#### 1.3 Painel admin (5 dias)

- `/admin/partners` — lista de parceiros com filtros (status, categoria, cidade)
- `/admin/partners/new` — formulário de criação
- `/admin/partners/[id]` — detalhe com timeline de ações, contatos, oportunidades, campanhas
- `/admin/campaigns` — lista de campanhas com aprovação
- Kanban board de oportunidades (drag & drop entre stages)

#### 1.4 Exibição no app (2 dias)

- Nova aba "Parceiros" no dashboard (substitui ou complementa "Ofertas")
- Cards de ofertas com logo do parceiro + cupom + CTA
- Tracking de cliques e resgates

---

### FASE 2 — Outbound Controlado (2 semanas)

**Objetivo:** Sistema de prospecção B2B supervisionada (não spam) com cadência, classificação de respostas e follow-up.

#### 2.1 Coleta de leads (3 dias)

- Script Python que busca empresas por categoria + cidade (Google Places API ou scraping)
- Importação manual via CSV no admin
- Validação de CNPJ via API ReceitaWS
- Enriquecimento: website, telefone, email (via Apollo.io ou similar)

#### 2.2 Cadência de prospecção (4 dias)

```prisma
model ProspectSequence {
  id          String   @id @default(cuid())
  partnerId   String
  channel     String   // email | whatsapp | linkedin | phone
  step        Int      // 1, 2, 3...
  message     String   // template personalizado
  scheduledAt DateTime
  sentAt      DateTime?
  status      String   @default("pending") // pending | sent | replied | bounced | opt_out
  responseClass String? // positive | neutral | negative | meeting | not_interested
  responseText String?
  createdAt   DateTime @default(now())

  @@index([partnerId, status])
  @@index([scheduledAt])
}
```

- Templates personalizados por categoria (oficina, pneus, etc.)
- Limite diário de envios (anti-spam)
- Dry-run mode (preview antes de enviar)
- Log de cada interação

#### 2.3 Classificação de respostas (3 dias)

- IA (z-ai-web-dev-sdk) classifica respostas automaticamente:
  - **Positive** → criar oportunidade
  - **Neutral** → agendar follow-up em 7 dias
  - **Negative** → marcar opt-out
  - **Meeting** → criar agendamento
  - **Not interested** → fechar lead

#### 2.4 Dashboard comercial (4 dias)

- `/admin/outbound` — dashboard com métricas:
  - Leads gerados hoje/semana/mês
  - Taxa de resposta
  - Taxa de reuniões agendadas
  - Funil de conversão (lead → contato → reunião → proposta → fechamento)
  - Tempo médio de resposta
  - Parceiros ativos vs rejeitados

---

### FASE 3 — Central Comercial (1 semana)

**Objetivo:** Materiais comerciais padronizados para a equipe de vendas.

#### 3.1 Media Kit (2 dias)

- `/admin/media-kit` — painel com:
  - Deck de apresentação (slides PDF)
  - Taxas de anúncio (banner top, card list, splash)
  - Métricas de audiência (usuários ativos, entregadores por cidade)
  - Cases de sucesso (parceiros ativos com resultados)
  - Templates de email comercial
  - Modelos de contrato

#### 3.2 Gerador de propostas (2 dias)

- Form no admin que gera proposta em PDF com:
  - Logo do parceiro
  - Tipo de campanha (cupom, banner, splash)
  - Período e investimento
  - Métricas estimadas (cliques, conversões)
  - Termos e condições
  - Assinatura digital

#### 3.3 Calendário editorial (3 dias)

- `/admin/calendar` — calendário visual com:
  - Campanhas ativas e futuras
  - Posts do blog agendados
  - Posts de redes sociais (YouTube, Instagram, TikTok, Facebook)
  - Ofertas sazonais (Black Friday, Natal, etc.)

---

### FASE 4 — Métricas e Analytics (1 semana)

**Objetivo:** Dashboard executivo com KPIs de negócio.

#### 4.1 Dashboard executivo (3 dias)

- `/admin/dashboard/executive` — visão geral:
  - **Receita:** MRR, vitalícios vendidos, receita de campanhas
  - **Usuários:** cadastros/dia, trial → PRO, churn
  - **Parceiros:** novos leads, ativos, receita por parceiro
  - **Indicações:** indicações pagas, custo por aquisição
  - **App:** sessões/dia, corridas lançadas, sessões de corre do dia

#### 4.2 Relatórios exportáveis (2 dias)

- Export CSV/PDF de:
  - Relatório de parceiros (status, receita, campanhas)
  - Relatório de usuários (cadastros, PRO, trial)
  - Relatório financeiro (receita por fonte)
  - Relatório de campanhas (cliques, conversões, ROI)

#### 4.3 Alertas e notificações (2 dias)

- Alerta quando parceiro não responde em 7 dias
- Alerta quando campanha expira em 3 dias
- Alerta quando trial de usuário expira em 3 dias
- Alerta quando indicação é convertida (pagar R$ 5)
- Notificação via WhatsApp (integração Z-API)

---

### FASE 5 — Governança e Segurança (1 semana)

**Objetivo:** Conformidade LGPD, auditoria e qualidade.

#### 5.1 LGPD e privacidade (2 dias)

- Termos de uso de parceiros (diferente dos termos de usuário)
- Política de privacidade para dados B2B
- Consentimento explícito para prospecção
- Direito de exclusão (opt-out permanente)
- Log de consentimentos

#### 5.2 Auditoria (2 dias)

- Toda ação administrativa é logada (AdminAction já existe)
- Log de acessos ao painel
- Log de alterações de status de parceiros
- Log de aprovações de campanhas
- Trilha de auditoria exportável

#### 5.3 Qualidade de parceiros (3 dias)

- Sistema de avaliação (1-5 estrelas) pelos entregadores
- Moderação de ofertas (aprovação manual antes de publicar)
- Denúncias de parceiros (spam, fraude, benefício falso)
- Whitelist/blacklist de empresas

---

### FASE 6 — Growth e Escala (contínuo)

**Objetivo:** Crescimento sustentável com automação.

#### 6.1 Automação de WhatsApp (1 semana)

- Integração com Z-API ou Evolution API
- Mensagens automáticas por gatilho:
  - Trial expirando (3 dias antes)
  - Novo parceiro na cidade do entregador
  - Oferta exclusiva PRO
  - Lembrete de lançar corridas
  - Confirmação de indicação paga

#### 6.2 Programa de afiliados expandido (1 semana)

- Tiers de indicação:
  - 🥉 Bronze (1-5): R$ 5 por amigo PRO
  - 🥈 Prata (6-15): R$ 7 por amigo PRO
  - 🥇 Ouro (16-30): R$ 10 por amigo PRO
  - 💎 Diamante (31+): R$ 15 por amigo PRO + bônus mensal
- Página pública de status: `/indicacoes/[code]`
- Leaderboard top indicadores

#### 6.3 SEO e conteúdo (contínuo)

- 10 posts de blog por mês (SEO para "app de entregador", "controlar corridas", etc.)
- Automação de postagem nas redes sociais
- Video marketing (YouTube shorts + TikTok)
- Newsletter semanal para base de emails

#### 6.4 Expansão geográfica (contínuo)

- Piloto em 1 cidade (Curitiba ou Belo Horizonte)
- Mapeamento de zonas quentes por cidade (usando mapa de calor)
- Parcerias locais (oficinas, postos, restaurantes)
- Grupo de WhatsApp por cidade

---

## 📅 Cronograma Resumido

| Fase | Duração | Entregáveis |
|------|---------|-------------|
| **Fase 1** — Central de Parceiros | 2 semanas | CRM, APIs, painel admin, exibição no app |
| **Fase 2** — Outbound Controlado | 2 semanas | Coleta de leads, cadência, classificação IA, dashboard |
| **Fase 3** — Central Comercial | 1 semana | Media kit, gerador de propostas, calendário |
| **Fase 4** — Métricas e Analytics | 1 semana | Dashboard executivo, relatórios, alertas |
| **Fase 5** — Governança e Segurança | 1 semana | LGPD, auditoria, qualidade de parceiros |
| **Fase 6** — Growth e Escala | Contínuo | WhatsApp automação, afiliados, SEO, expansão |

**Total estimado:** 7-8 semanas para Fases 1-5 + crescimento contínuo na Fase 6.

---

## 🏗️ Arquitetura Técnica

### Stack atual (mantida)
- **Frontend:** Next.js 16 + Tailwind CSS 4 + shadcn/ui
- **Backend:** API Routes do Next.js
- **DB:** PostgreSQL (Supabase) + SQLite (dev)
- **Auth:** JWT (cookie httpOnly)
- **Local DB:** Dexie.js (IndexedDB)
- **Maps:** Leaflet + OpenStreetMap
- **Deploy:** Vercel

### Novas integrações
- **WhatsApp:** Z-API ou Evolution API
- **Email:** Resend (já configurado)
- **IA:** z-ai-web-dev-sdk (classificação de respostas)
- **PDF:** jsPDF (gerador de propostas)
- **Google Places API:** coleta de leads B2B

### Princípios do Manus (incorporados)
1. **Inspeção antes da execução** — verificar ambiente antes de criar
2. **Perguntar apenas o que falta** — não duplicar dados existentes
3. **Dry-run mode** — preview antes de enviar prospecção
4. **Classificação de respostas** — automática via IA
5. **Respeito a opt-outs** — permanente e auditável
6. **Logs de tudo** — trilha completa de ações
7. **Cadência controlada** — limites anti-spam
8. **Benefício real** — não vender, oferecer valor

---

## 📈 Métricas de Sucesso

| Métrica | Atual | Meta Fase 1-3 | Meta Fase 4-6 |
|---------|-------|---------------|---------------|
| Usuários ativos | ~50 | 500 | 5.000 |
| Conversão trial → PRO | ~5% | 12% | 18% |
| Parceiros ativos | 0 | 20 | 100 |
| Receita mensal | ~R$ 100 | R$ 2.000 | R$ 15.000 |
| CAC | ~R$ 15 | R$ 5 | R$ 3 |
| Indicações/mês | ~2 | 20 | 100 |
| Posts de blog | 10 | 30 | 100 |

---

## ⚡ Próximos Passos Imediatos

1. **Aprovar este plano** e definir prioridade das fases
2. **Definir cidade-piloto** (Curitiba, Belo Horizonte ou Recife)
3. **Definir responsável comercial** (quem vai operar o CRM)
4. **Configurar WhatsApp API** (Z-API ou Evolution)
5. **Iniciar Fase 1** — criar schema do Partner + APIs + painel admin

> *"Tratar outbound como prospecção B2B supervisionada e orientada a benefício real, e não como envio massivo de mensagens."* — Princípio central do Manus
