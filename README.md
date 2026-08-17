# 🏍️ MeuCorre — Gestão Financeira para Entregadores

> **PWA (Progressive Web App)** instalável que ajuda entregadores de app a centralizar corridas, registrar despesas e visualizar o lucro líquido — inclusive sem conexão. Plano vitalício R$ 18,90.

[![Deploy](https://img.shields.io/badge/Vercel-Live-brightgreen)](https://meucorre.vercel.app)
[![Security](https://img.shields.io/badge/Security-9.5%2F10-blue)](docs/SEGURANCA-OWASP.md)
[![npm audit](https://img.shields.io/badge/npm%20audit-0%20vulns-success)](https://github.com/clodoaldosilva608/MeuCorre/actions)
[![License](https://img.shields.io/badge/License-Proprietary-red)](LICENSE)

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Acesso](#acesso)
- [Stack Tecnológica](#stack-tecnológica)
- [Arquitetura](#arquitetura)
- [Funcionalidades](#funcionalidades)
- [Admin Panel](#admin-panel)
- [Segurança](#segurança)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Desenvolvimento Local](#desenvolvimento-local)
- [Deploy](#deploy)
- [Documentação](#documentação)
- [Releases](#releases)

---

## Visão Geral

O MeuCorre é uma plataforma SaaS para entregadores de aplicativo (iFood, Rappi, 99Food, etc.) que resolve o problema de **faturamento ≠ lucro**. O app permite:

- 📊 **Registrar corridas e despesas** com interface simples
- 💰 **Ver o lucro líquido** em tempo real (ganhos - despesas)
- 🗺️ **Mapa de calor** das zonas onde mais rodou (GPS)
- ⏱️ **Corre do dia** — timer com geolocalização
- 🎯 **Metas diárias/semanais** com progresso visual
- 📱 **PWA instalável** — funciona offline (IndexedDB + sync)
- 🔥 **Radar do Prejuízo** — alertas explicáveis
- 📈 **MeuCorre Score** — consistência sem julgamento
- 🏆 **Desafio de 7 dias** — engajamento gamificado

### Enterprise Features (B2B)

- 📅 **Central de Divulgação** — 450 postagens prontas (90 dias × 5/dia)
- 🤝 **CRM de Parceiros** — pipeline Kanban com 12 estágios
- 📄 **Propostas e Materiais** — templates com modelo duplo de cobrança
- 🏷️ **Campanhas de Parceiros** — ofertas no app com métricas
- 📤 **Outbound Supervisionado** — prospecção B2B com dry-run obrigatório
- 📊 **Dashboard Executivo** — KPIs, alertas e relatórios CSV
- 👥 **Equipes B2B** — times com convites e painel agregado
- 🔐 **Portal do Parceiro** — visão restrita via token

---

## Acesso

| Ambiente | URL |
|----------|-----|
| **Produção** | https://meucorre.vercel.app |
| **App (usuário)** | https://meucorre.vercel.app/app |
| **Admin** | https://meucorre.vercel.app/admin |
| **Quiz** | https://meucorre.vercel.app/quiz |
| **Blog** | https://meucorre.vercel.app/blog |

---

## Stack Tecnológica

### Frontend
- **Next.js 16** (App Router, Turbopack)
- **React 19** + **TypeScript 5**
- **Tailwind CSS 4** + **shadcn/ui** (Radix UI)
- **Framer Motion** — animações
- **Leaflet** + **OpenStreetMap** — mapa de calor
- **Dexie.js** (IndexedDB) — armazenamento local-first PWA
- **Recharts** — gráficos
- **@dnd-kit** — drag & drop (Kanban)

### Backend
- **Next.js API Routes** (serverless)
- **Prisma ORM 6** + **PostgreSQL** (Supabase)
- **JWT** (jose) — autenticação httpOnly cookies
- **bcrypt** — hash de senhas (10 rounds)
- **Upstash Redis** — rate limiting
- **Sentry** — error tracking

### Infraestrutura
- **Vercel** — hosting + CDN + auto-deploy
- **Supabase** — PostgreSQL + Storage + RLS
- **GitHub Actions** — CI (TypeCheck + ESLint + npm audit + Gitleaks + Snyk)
- **Kiwify** — processamento de pagamentos
- **Resend** — envio de emails
- **Google Blogger API** — publicação de blog

### Segurança
- **RLS** (Row Level Security) em 41 tabelas
- **CSP** sem `unsafe-eval` + report-uri
- **HSTS** + COOP + CORP
- **Zod** — validação de input (15 schemas)
- **Gitleaks** — caça segredos no Git
- **Snyk** — scanner de vulnerabilidades
- **0 vulnerabilidades** no npm audit

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     VERCEL (Serverless)                      │
│                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐    │
│  │   Next.js    │   │  API Routes  │   │   Prisma     │    │
│  │   Frontend   │──▶│  (135 routes)│──▶│   ORM 6     │    │
│  │  (48 pages)  │   │              │   │              │    │
│  │  (105 comps) │   │  Auth: JWT   │   └──────┬───────┘    │
│  └──────────────┘   │  Rate Limit  │          │             │
│         │           │  Zod schema  │          │             │
│         │           └──────────────┘          ▼             │
│         │                                ┌──────────┐       │
│         │     ┌──────────────┐           │ Supabase │       │
│         │     │  IndexedDB   │           │PostgreSQL│       │
│         └────▶│  (Dexie.js)  │           │  + RLS   │       │
│               │  Offline     │           │41 tabelas│       │
│               └──────────────┘           └──────────┘       │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  CDN (Vercel)                         │   │
│  │  450 imagens do Pacote Visual (52 MB, 1080px JPEG)   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Padrão Local-First
O app do entregador é **100% local-first** — todos os dados ficam no IndexedDB (Dexie.js) e funcionam offline. Quando o usuário faz login, os dados sincronizam com o servidor via `/api/sync`.

### Padrão Admin
O painel admin é **server-side rendered** — todas as operações passam por API Routes com autenticação JWT + Prisma.

---

## Funcionalidades

### App do Entregador (PWA)

| Feature | Descrição |
|---------|-----------|
| Dashboard | Lucro líquido, resumo do dia, gráficos |
| Corridas | Lançar, editar, listar, filtrar |
| Despesas | Registrar por categoria |
| Gráficos | Receita vs despesas, tendências |
| Metas | Diárias/semanais com progresso |
| Corre do dia | Timer + GPS (haversine) |
| Mapa de calor | Leaflet + OpenStreetMap |
| Onboarding | Pop-up tutorial 9 passos |
| Quiz | Captação de leads com score |
| Ofertas | Produtos parceiros com desconto |
| Anúncios | Banner + card + splash |
| Indicações | Código único + recompensa |
| Radar do Prejuízo | Alertas explicáveis |
| MeuCorre Score | Consistência (não julga) |
| Desafio 7 dias | Tarefas diárias gamificadas |

### Admin Panel (16 módulos)

| Módulo | Descrição | Feature Flag |
|--------|-----------|-------------|
| Dashboard | KPIs gerais (ads, subs, feedback) | Sempre ativo |
| Métricas | Dashboard executivo + alertas + CSV | Sempre ativo |
| Anúncios | CRUD com placement (banner/card/splash) | Sempre ativo |
| Ofertas | CRUD com categoria e PRO-only | Sempre ativo |
| Blog | CRUD + integração Blogger OAuth2 | Sempre ativo |
| Assinaturas | Pix manual + Kiwify webhook | Sempre ativo |
| Usuários | CRUD + ativar/desativar PRO | Sempre ativo |
| Indicações | Campanha + códigos + conversões | Sempre ativo |
| Feedbacks | Avaliações 1-5 estrelas | Sempre ativo |
| Feature Flags | Toggle on/off de 10 módulos | Sempre ativo |
| Divulgação | 450 posts + assets + canais + ICS | `admin_marketing_hub_enabled` |
| Parceiros | CRM Kanban + contatos + atividades | `admin_partner_crm_enabled` |
| Propostas | Templates + workflow approve/reject | `admin_partner_crm_enabled` |
| Campanhas | CRUD + publish + métricas + denúncia | `partner_campaigns_enabled` |
| Outbound | Templates + dry-run + classify IA | `partner_outbound_preview_enabled` |
| Equipes | Times B2B + convites + painel | `admin_teams_enabled` |

---

## Segurança

### Auditoria Completa — Nota 9.5/10

| Área | Status | Detalhe |
|------|--------|---------|
| RLS Supabase | ✅ | 41 tabelas com policies |
| Auth server-side | ✅ | 104 endpoints com isAdminAuthed/getUserSession |
| IDOR protection | ✅ | Validação de dono em endpoints com ID |
| npm audit | ✅ | 0 vulnerabilidades |
| Rate limiting | ✅ | Login, quiz, tracking, convert, sync |
| CSP | ✅ | Sem unsafe-eval + report-uri + COOP + CORP |
| Secrets | ✅ | Nenhum no código, .env no .gitignore |
| Zod validation | ✅ | 15 schemas + validateOrError() |
| Política de senhas | ✅ | 8+ chars, maiúscula, minúscula, número, blacklist |
| Scanners CI | ✅ | npm audit + Gitleaks + Snyk |
| LGPD | ✅ | Opt-out permanente, minimização, auditoria |
| Sentry | ✅ | Error tracking em produção |

Documentação completa:
- [Plano de Correção de Segurança](docs/PLANO_CORRECAO_SEGURANCA.md)
- [Guia OWASP](docs/SEGURANCA-OWASP.md)
- [SECURITY.md](SECURITY.md)

---

## Estrutura do Projeto

```
meucorre/
├── prisma/
│   ├── schema.prisma          # 41 modelos Prisma
│   └── supabase-rls.sql       # Script RLS para Supabase
├── public/
│   ├── promotion/             # 450 imagens (52 MB, 1080px JPEG)
│   └── screenshots/           # Screenshots do app
├── src/
│   ├── app/
│   │   ├── admin/             # 16 páginas admin
│   │   ├── api/               # 135 API routes
│   │   ├── blog/              # Blog (8 posts)
│   │   ├── equipes/           # Convite de equipes (público)
│   │   ├── portal/            # Portal do parceiro (público)
│   │   ├── propostas/         # Proposta pública (token)
│   │   ├── quiz/              # Quiz de captação
│   │   └── ...                # Landing, login, register, etc
│   ├── components/
│   │   ├── admin/             # Componentes admin (6 módulos)
│   │   ├── meucorre/          # Componentes do app (30+)
│   │   ├── social-icons.tsx   # Capacetes F1 (redes sociais)
│   │   └── ui/                # shadcn/ui (47 componentes)
│   ├── hooks/                 # 9 hooks (use-deliveries, use-sync, etc)
│   ├── lib/                   # 22 módulos (auth, prisma, validation, etc)
│   └── middleware.ts          # Middleware de autenticação
├── tests/
│   └── e2e/                   # 26 arquivos de teste Playwright
├── scripts/                   # 34 scripts (seed, upload, validação)
├── docs/                      # 9 documentos técnicos
├── .github/workflows/ci.yml   # CI com 4 jobs (quality + 3 security)
├── .gitleaks.toml             # Regras customizadas Gitleaks
├── SECURITY.md                # Política de segurança
└── next.config.ts             # Config + CSP + headers
```

### Estatísticas

| Métrica | Valor |
|---------|-------|
| Linhas de código | ~56.000 |
| Modelos Prisma | 41 |
| Endpoints API | 135 |
| Páginas | 48 |
| Componentes React | 105 |
| Testes E2E | 26 arquivos (~80 cenários) |
| Scripts | 34 |
| Commits | 240+ |
| Imagens do pacote visual | 450 (52 MB) |
| Documentos | 9 |

---

## Variáveis de Ambiente

```bash
# Supabase (Postgres)
DATABASE_URL="postgresql://...@pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...@pooler.supabase.com:5432/postgres"

# Supabase Storage (opcional — para upload de imagens)
NEXT_PUBLIC_SUPABASE_URL="https://PROJECT_REF.supabase.co"
SUPABASE_SERVICE_ROLE_KEY=""  # configure only in the deployment environment

# Auth
ADMIN_EMAIL="admin@meucorre.com"
ADMIN_PASSWORD=""  # configure only in the deployment environment
ADMIN_JWT_SECRET="openssl-rand-hex-32"
USER_JWT_SECRET="openssl-rand-hex-32"

# Pagamentos
PIX_KEY="seu-pix@email.com"
PIX_MERCHANT_NAME="MeuCorre"
PLAN_PRICE=18.90
KIWIFY_PRODUCT_ID=""
KIWIFY_WEBHOOK_SECRET=""

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# Email (Resend)
RESEND_API_KEY=""
RESEND_FROM_EMAIL=""

# Monitoramento
SENTRY_DSN=""
NEXT_PUBLIC_SENTRY_DSN=""

# E2E Tests
E2E_TEST_BYPASS_TOKEN=""
```

Ver `.env.example` para template completo.

---

## Desenvolvimento Local

```bash
# 1. Clone o repositório
git clone https://github.com/clodoaldosilva608/MeuCorre.git
cd MeuCorre

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com seus valores

# 4. Gere o cliente Prisma
npx prisma generate

# 5. Sincronize o banco (cria tabelas)
npx prisma db push

# 6. Rode o servidor de desenvolvimento
npm run dev

# 7. Acesse
# App: http://localhost:3000
# Admin: http://localhost:3000/admin
```

### Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run lint         # ESLint
npm run test:e2e     # Testes E2E (Playwright)
npm run db:push      # Sincronizar schema com banco
npm run db:generate  # Gerar cliente Prisma
```

---

## Deploy

O deploy é automático via **Vercel** — todo push para `main` dispara um build.

### Build Command
```json
"buildCommand": "prisma generate && prisma db push --accept-data-loss && next build"
```

### Passos para Deploy Manual
1. Push para `main`
2. Vercel detecta e inicia build
3. `prisma generate` — gera cliente
4. `prisma db push` — cria tabelas novas (aditivo)
5. `next build` — build de produção
6. Deploy automaticamente

### Configurar Supabase RLS
1. Acesse o SQL Editor do Supabase
2. Cole o conteúdo de `prisma/supabase-rls.sql`
3. Execute

---

## Releases (Plano Implementação Seguro)

Todas as 9 releases (A-I) foram implementadas e validadas em produção:

| Release | Descrição | Status | Commits |
|---------|-----------|--------|---------|
| A | Baseline e proteção | ✅ Concluída | 2 |
| B | Fundação administrativa | ✅ Concluída | 1 |
| C | Central de Divulgação (450 posts) | ✅ Concluída | 7 |
| D | CRM Básico (Parceiros) | ✅ Concluída | 7 |
| E | Propostas e Materiais | ✅ Concluída | 4 |
| F | Campanhas e Ofertas | ✅ Concluída | 4 |
| G | Outbound Supervisionado | ✅ Concluída | 5 |
| H | Métricas e Relatórios | ✅ Concluída | 3 |
| I | Recursos Avançados | ✅ Concluída | 5 |

**Total**: 50 unidades atômicas, 38+ commits, ~56.000 linhas

### Log de Implementação
- [IMPLEMENTATION_LOG.md](docs/IMPLEMENTATION_LOG.md) — Registro detalhado de cada unidade

### Plano Original
- [PLANO_IMPLEMENTACAO_SEGURO_MEU_CORRE.md](docs/PLANO_IMPLEMENTACAO_SEGURO_MEU_CORRE.md) — Plano completo (1100+ linhas)

---

## Documentação

| Documento | Descrição |
|-----------|-----------|
| [IMPLEMENTATION_LOG.md](docs/IMPLEMENTATION_LOG.md) | Log de cada unidade atômica implementada |
| [PLANO_IMPLEMENTACAO_SEGURO_MEU_CORRE.md](docs/PLANO_IMPLEMENTACAO_SEGURO_MEU_CORRE.md) | Plano completo com 9 releases |
| [RELATORIO_PRODUCAO.md](docs/RELATORIO_PRODUCAO.md) | Relatório de produção (estado final) |
| [SEGURANCA-OWASP.md](docs/SEGURANCA-OWASP.md) | Guia OWASP Top 10 aplicado ao MeuCorre |
| [PLANO_CORRECAO_SEGURANCA.md](docs/PLANO_CORRECAO_SEGURANCA.md) | Plano de correção de segurança (15 vulns) |
| [BASELINE_QA.md](docs/BASELINE_QA.md) | Matriz de teste manual de baseline |
| [SUPABASE-STORAGE-SETUP.md](docs/SUPABASE-STORAGE-SETUP.md) | Guia de configuração do Supabase Storage |
| [LEAD-GENERATION-STRATEGY.md](docs/LEAD-GENERATION-STRATEGY.md) | Estratégia de captação de leads |
| [SECURITY.md](SECURITY.md) | Política de segurança e report de vulns |

---

## Funcionalidades por Release

### Release C — Central de Divulgação
- 450 postagens (90 dias × 5/dia) importadas e vinculadas a imagens
- 450 imagens redimensionadas (1080px JPEG, 52 MB total)
- 6 canais oficiais (Instagram, TikTok, YouTube, Facebook, App, Quiz)
- Calendário visual com mapa de calor dos 90 dias
- Botões de cópia individual (título, descrição, hashtags, CTA, link)
- Exportação ICS (calendário)
- Lembretes (Notification API + fallback)
- Upload de imagens (.tar.gz com extração no navegador)

### Release D — CRM de Parceiros
- 22 parceiros seed de Recife/PE (decisão #1)
- Pipeline Kanban com 12 estágios (drag & drop @dnd-kit)
- Ficha 360° (contatos, oportunidades, atividades, logs)
- Importação CSV com preview e deduplicação
- Dashboard CRM (pipeline, tarefas, alertas)
- assignedTo = "Clodoaldo Silva" (decisão #3)

### Release E — Propostas e Materiais
- 3 templates de proposta (standard_both, campaign_only, lead_only)
- Modelo duplo de cobrança (decisão #7)
- Workflow: draft → sent → approved/rejected
- Link público com token (página renderiza Markdown)
- Biblioteca de materiais (8 tipos: media_kit, case, contract, etc.)

### Release F — Campanhas de Parceiros
- Workflow: draft → approved → published → paused/expired
- Métricas: views, clicks, leads, redemptions, CTR
- Auto-pausa após 3 denúncias
- Auto-expiração quando endsAt passa
- API pública para app do entregador (/api/public/campaigns)
- Não modifica Ad/Offer existentes (camada adicional)

### Release G — Outbound Supervisionado
- Templates versionados com variáveis ({NOME}, {EMPRESA}, etc.)
- Dry-run obrigatório (preview sem envio)
- Workflow: preparado → aguardando_aprovacao → enviado → classificado
- Classificação de respostas: manual ou IA (z-ai-web-dev-sdk)
- 8 categorias: permission_to_send, interessado, pricing_question, etc.
- Opt-out PERMANENTE (bloqueia em 3 pontos)
- Feature flag send separada (OFF por padrão)

### Release H — Métricas e Relatórios
- Dashboard executivo com 4 KPIs grandes + 6 pequenos
- Funil de parceiros visual (12 estágios)
- 3 StatusGrids (Outbound, Propostas, Divulgação)
- 8 categorias de alertas (leads_sem_contato, proposta_vencida, etc.)
- 4 relatórios CSV exportáveis (parceiros, usuários, financeiro, campanhas)
- BOM UTF-8 para Excel compatível

### Release I — Recursos Avançados
- Equipes B2B (Team, TeamMember, TeamInvite)
- Portal do Parceiro (token único, permissões granulares)
- Radar do Prejuízo (5 tipos de alertas explicáveis)
- MeuCorre Score (3 fatores ponderados, não julga)
- Desafio de 7 dias (7 tarefas diárias)

---

## CI/CD

O GitHub Actions roda 4 jobs a cada push/PR:

| Job | O que faz |
|-----|-----------|
| quality | TypeCheck + ESLint (continue-on-error) |
| security-audit | npm audit (dependências) |
| gitleaks | Caça segredos no código + histórico Git |
| snyk | Scanner avançado de vulnerabilidades (se SNYK_TOKEN) |

---

## Licença

Proprietary — © 2026 MeuCorre. Todos os direitos reservados.

## Contato

- **Website**: https://meucorre.vercel.app
- **Email**: contato@meucorre.com.br
- **Responsável**: Clodoaldo Silva
