# ⚡ MeuCorre — PWA para Entregadores

> Aplicativo web progressivo (PWA) para entregadores de aplicativo (iFood, 99Food, Lalamove, Rappi, Loggi e outros) controlarem corridas, despesas, lucro líquido e ganhos por plataforma — tudo em um só lugar, 100% offline, com dados ficando apenas no celular do entregador.

**Criado e desenvolvido por:** Clodoaldo C Silva 🇧🇷

---

## 📸 Screenshots

### Landing Page Pública
| Hero | Planos |
|---|---|
| ![Landing Hero](docs/screenshots/01-landing-hero.png) | ![Landing Planos](docs/screenshots/02-landing-planos.png) |

### App do Entregador (PWA)
| Dashboard (Dark) | Dashboard (Light) | Nova Corrida |
|---|---|---|
| ![App Dark](docs/screenshots/03-app-dashboard-dark.png) | ![App Light](docs/screenshots/04-app-dashboard-light.png) | ![Nova Corrida](docs/screenshots/05-app-nova-corrida.png) |

### Painel Administrativo
| Login | Dashboard | Anúncios | Assinaturas | Feedbacks |
|---|---|---|---|---|
| ![Login](docs/screenshots/06-admin-login.png) | ![Dashboard](docs/screenshots/07-admin-dashboard.png) | ![Anúncios](docs/screenshots/08-admin-ads.png) | ![Assinaturas](docs/screenshots/09-admin-subscriptions.png) | ![Feedbacks](docs/screenshots/10-admin-feedback.png) |

---

## 📋 Índice

1. [Visão Geral](#-visão-geral)
2. [Funcionalidades](#-funcionalidades)
3. [Arquitetura](#-arquitetura)
4. [Stack Tecnológica](#-stack-tecnológica)
5. [Estrutura do Projeto](#-estrutura-do-projeto)
6. [Schema do Banco de Dados](#-schema-do-banco-de-dados)
7. [Variáveis de Ambiente](#-variáveis-de-ambiente)
8. [Como Rodar Localmente](#-como-rodar-localmente)
9. [Deploy em Produção](#-deploy-em-produção)
10. [Manual de Uso — App do Entregador](#-manual-de-uso--app-do-entregador)
11. [Manual de Uso — Painel Admin](#-manual-de-uso--painel-admin)
12. [Integração Kiwify (Pagamentos)](#-integração-kiwify-pagamentos)
13. [API Reference](#-api-reference)
14. [Roadmap](#-roadmap)
15. [Segurança](#-segurança)
16. [Licença](#-licença)

---

## 🎯 Visão Geral

O **MeuCorre** resolve uma dor real de milhares de entregadores brasileiros: o **faturamento fragmentado** entre múltiplos apps de entrega. Quem trabalha com iFood + 99Food + Lalamove simultaneamente precisa abrir cada app pra saber quanto ganhou no dia — e pior, frequentemente esquece de lançar despesas (gasolina, manutenção, alimentação), descobrindo tarde demais que o "lucro" imaginário foi consumido por gastos invisíveis.

### O que o MeuCorre faz

- **Centraliza** corridas de todos os apps de entrega em um único dashboard
- **Calcula** lucro líquido (ganhos − despesas) em tempo real
- **Funciona 100% offline** — dados ficam no celular do entregador (IndexedDB)
- **É instalável** como app nativo (PWA), sem passar por lojas
- **Permite** ao administrador cadastrar anúncios de parceiros (oficinas, seguradoras, etc.)
- **Vende** plano vitalício PRO via Kiwify com ativação automática

### Modelo de negócio

- **Plano gratuito**: 14 dias de trial + 5 lançamentos/dia após + anúncios
- **Plano PRO vitalício**: R$ 18,90 (oferta de lançamento, depois R$ 97) — pagamento único, sem anúncios, features avançadas

---

## ✨ Funcionalidades

### App do Entregador (gratuito)

- ⚡ **Lançamento rápido de corridas**: botões de valor rápido (R$ 5/10/15/20/25/30)
- 📊 **Dashboard em tempo real**: total de ganhos, lucro líquido, número de corridas, km rodados
- 💸 **Controle de despesas**: 6 categorias (combustível, alimentação, manutenção, bateria, pedágio, outros)
- 📈 **Gráficos Recharts**: área (ganhos vs despesas 7 dias), pizza (distribuição por app), barras (despesas por categoria)
- 🛵 **Multi-app**: iFood, 99Food, Lalamove, Rappi, Loggi + cadastro de apps customizados com upload de imagem oficial
- 🔔 **Captura por notificação**: cole o texto da notificação do app e o MeuCorre extrai app + valor automaticamente
- 📅 **Filtro de período**: Hoje / Semana / Mês / Tudo
- 🌗 **Theme toggle**: claro/escuro (persistente)
- 📤 **Exportar dados**: JSON (backup) e CSV (Excel/Sheets)
- 📴 **100% offline**: funciona em garagens, subsolos, áreas sem sinal
- 📲 **Instalável**: PWA com ícone na tela inicial

### Plano PRO (vitalício)

- 🚫 **Sem anúncios** no app
- 📄 **Relatórios PDF** mensais (ganhos, despesas, lucro, gráficos)
- ☁️ **Backup em nuvem** criptografado entre dispositivos
- 🎯 **Metas diárias e semanais** com progresso visual
- 🔧 **Lembretes de manutenção** (troca de óleo, revisão, IPVA baseado em km)
- 🔔 **Captura por notificação ilimitada**

### Painel Administrativo

- 📊 **Dashboard**: receita total, vendas aprovadas/pendentes, CTR dos anúncios, nota média dos feedbacks
- 📣 **CRUD de anúncios**: 3 placements (banner topo, card entre listas, splash patrocinado), cores customizáveis, imagem, CTA, vigência, ativar/desativar, tracking de views/clicks
- 💳 **Gestão de assinaturas**: filtra por status (pendentes/aprovadas/rejeitadas/todas), revisa comprovantes, aprova (gera licença crypto), rejeita com notas
- 💬 **Feedbacks**: lista feedbacks dos usuários com filtros por nota (1-5 estrelas), estatísticas, excluir

### Landing Page Pública

- 🎨 **Hero dark** com glow esmeralda + headline impactante
- 📱 **Phone mockup** mostrando preview do app
- 💡 **6 features** em grid visual
- ⭐ **Depoimento** com 5 estrelas
- 💰 **Card de plano** com preço de lançamento (R$ 97 riscado + R$ 18,90)
- ❓ **FAQ** acordeão (5 perguntas)
- 🔒 **Checkout** que redireciona pra Kiwify (Pix ou cartão)

---

## 🏗️ Arquitetura

O MeuCorre usa **2 camadas de dados distintas**:

```
┌─────────────────────────────────────────────────────────────┐
│                       LANDING PAGE (/)                       │
│  Página pública com hero, features, planos, checkout Kiwify │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    APP DO ENTREGADOR (/app)                  │
│  100% Local-First — dados no IndexedDB (Dexie.js)           │
│  Funciona offline. Anúncios vêm da API (quando online).     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ (quando online)
┌─────────────────────────────────────────────────────────────┐
│                    PAINEL ADMIN (/admin)                     │
│  Protegido por email+senha. Usa Postgres (Supabase).        │
│  CRUD de anúncios, assinaturas, feedbacks, dashboard.       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  SUPABASE POSTGRES (Postgres)                │
│  Tabelas: Ad, Subscription, AdEvent, Feedback               │
│  Persistente — não se perde no cold start                   │
└─────────────────────────────────────────────────────────────┘
```

### Princípios

1. **Local-First**: dados do entregador (corridas, despesas) ficam no celular — zero servidor, máxima privacidade
2. **Server-Side Admin**: anúncios, assinaturas e feedbacks ficam no Postgres (Supabase) pra persistência e gestão centralizada
3. **PWA Instalável**: funciona como app nativo, sem burocracia de lojas
4. **Auto-ativação de licença**: webhook Kiwify → licença gerada → cliente redirecionado → app ativa automaticamente

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript 5 |
| UI | Tailwind CSS 4 + shadcn/ui + Lucide icons |
| Animações | Framer Motion |
| Banco local (app) | IndexedDB via Dexie.js 4 + dexie-react-hooks |
| Banco servidor (admin) | PostgreSQL via Prisma 6 (Supabase) |
| Gráficos | Recharts |
| Pagamentos | Kiwify (webhook + redirect checkout) |
| Auth admin | Cookie httpOnly com token opaco (email+senha) |
| Tema | next-themes (claro/escuro persistente) |
| PWA | manifest.json + Service Worker (stale-while-revalidate) |
| Deploy | Vercel (production) + GitHub (código) |
| Package manager | Bun |

---

## 📁 Estrutura do Projeto

```
meucorre/
├── prisma/
│   └── schema.prisma                    # Schema Postgres (Ad, Subscription, AdEvent, Feedback)
│
├── public/
│   ├── manifest.json                    # PWA manifest
│   ├── sw.js                            # Service Worker (offline)
│   ├── icon-192.png, icon-512.png       # App icons
│   ├── icon-maskable-512.png            # Maskable icon (Android)
│   ├── apple-touch-icon.png             # iOS icon
│   └── favicon-32.png
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                   # Root layout (ThemeProvider, metadata, SW)
│   │   ├── page.tsx                     # Landing page pública (hero, planos, FAQ)
│   │   ├── globals.css                  # Estilos globais (light + dark)
│   │   │
│   │   ├── app/                         # App do entregador (Local-First)
│   │   │   └── page.tsx                 # Dashboard + tabs (Corridas/Despesas/Gráficos)
│   │   │
│   │   ├── admin/                       # Painel admin (Server-Side, Postgres)
│   │   │   ├── layout.tsx               # Sidebar + auth check
│   │   │   ├── login/page.tsx           # Login (email + senha)
│   │   │   ├── dashboard/page.tsx       # Visão geral (receita, vendas, CTR, rating)
│   │   │   ├── ads/page.tsx             # CRUD de anúncios
│   │   │   ├── subscriptions/page.tsx   # Revisar assinaturas (aprovar/rejeitar)
│   │   │   └── feedback/page.tsx        # Lista feedbacks dos usuários
│   │   │
│   │   ├── obrigado/page.tsx            # Pós-pagamento: mostra licença + auto-redirect
│   │   │
│   │   └── api/
│   │       ├── ads/route.ts             # GET público (lista anúncios ativos)
│   │       ├── ads/[id]/click/route.ts  # POST (registrar clique)
│   │       ├── subscription/route.ts    # POST (cria compra Pix manual) + GET (status)
│   │       ├── subscription/[id]/receipt/route.ts  # POST (upload comprovante)
│   │       ├── license/verify/route.ts  # POST (valida licença PRO)
│   │       ├── license/by-order/route.ts # GET (busca licença por order_id ou email)
│   │       ├── feedback/route.ts        # POST (recebe feedback)
│   │       ├── webhooks/kiwify/route.ts # POST (webhook Kiwify — auto-aprova)
│   │       └── admin/
│   │           ├── login/route.ts       # POST (auth)
│   │           ├── logout/route.ts      # POST
│   │           ├── ads/route.ts         # GET/POST (CRUD)
│   │           ├── ads/[id]/route.ts    # PATCH/DELETE
│   │           ├── subscriptions/route.ts # GET/POST (aprovar/rejeitar)
│   │           ├── dashboard/route.ts   # GET (estatísticas)
│   │           └── feedback/route.ts    # GET/DELETE
│   │
│   ├── components/
│   │   ├── theme-provider.tsx           # Wrapper next-themes
│   │   ├── theme-toggle.tsx             # Botão Sun/Moon
│   │   ├── ui/                          # shadcn/ui components
│   │   └── meucorre/
│   │       ├── header.tsx               # Header do app
│   │       ├── splash-screen.tsx        # Splash com mascote Foguetinho
│   │       ├── summary-cards.tsx        # Cards Total/Lucro/Corridas/KM
│   │       ├── period-filter.tsx        # Toggle Hoje/Semana/Mês/Tudo
│   │       ├── app-summary.tsx          # Barras por app
│   │       ├── delivery-list.tsx        # Lista de corridas
│   │       ├── delivery-form.tsx        # Modal Nova/Editar corrida
│   │       ├── expense-list.tsx         # Lista de despesas
│   │       ├── expense-form.tsx         # Modal Nova/Editar despesa
│   │       ├── app-manager.tsx          # CRUD de apps + upload imagem
│   │       ├── notification-capture.tsx # Captura por notificação (parser)
│   │       ├── charts.tsx               # 3 gráficos Recharts
│   │       ├── bottom-nav.tsx           # Nav inferior (tabs)
│   │       ├── fab.tsx                  # Botão flutuante +
│   │       ├── ad-banner.tsx            # Anúncio banner topo
│   │       ├── ad-card.tsx              # Anúncio card entre listas
│   │       ├── sponsored-splash.tsx     # Anúncio na splash
│   │       ├── license-dialog.tsx       # Dialog ativar licença
│   │       ├── promo-popup.tsx          # Pop-up compre PRO
│   │       ├── share-popup.tsx          # Pop-up compartilhar
│   │       ├── feedback-popup.tsx       # Pop-up feedback
│   │       └── share-icons.tsx          # SVGs WhatsApp/FB/X/Telegram
│   │
│   ├── hooks/
│   │   ├── use-deliveries.ts            # Hooks Dexie (corridas, despesas, apps)
│   │   ├── use-ads.ts                   # Hook anúncios + licença
│   │   └── use-trial.ts                 # Trial 14 dias + limites free
│   │
│   └── lib/
│       ├── db.ts                        # Dexie schema (IndexedDB local)
│       ├── prisma.ts                    # Prisma client (Postgres)
│       ├── admin-auth.ts                # Validação cookie admin
│       ├── types.ts                     # Tipos TypeScript
│       ├── apps.ts                      # Apps DB + formatadores + parser
│       └── utils.ts                     # cn() helper
│
├── scripts/
│   ├── generate_icons.py                # Gera ícones PWA (Pillow)
│   ├── generate_kiwify_banner.py        # Gera banner produto Kiwify
│   ├── kiwify_login.py                  # Login Kiwify (Playwright stealth)
│   └── kiwify_debug.py                  # Debug página Kiwify
│
├── docs/
│   └── screenshots/                     # 10 screenshots do app
│
├── .env.example                         # Template env vars
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── eslint.config.mjs
└── README.md                            # Este arquivo
```

---

## 🗄️ Schema do Banco de Dados

### Postgres (Supabase) — servidor

```prisma
model Ad {
  id          String   @id @default(cuid())
  title       String
  description String?
  cta         String   @default("Saiba mais")
  url         String?
  imageUrl    String?
  bgColor     String   @default("#10b981")
  textColor   String   @default("#09090b")
  placement   String   @default("banner_top")  // banner_top | card_list | splash
  active      Boolean  @default(true)
  startsAt    DateTime @default(now())
  endsAt      DateTime?
  clicks      Int      @default(0)
  views       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([placement, active])
}

model Subscription {
  id              String   @id @default(cuid())
  buyerName       String
  buyerEmail      String
  buyerPhone      String?
  buyerCity       String?
  amount          Float    @default(18.90)
  paymentMethod   String   @default("pix_manual")  // pix_manual | kiwify
  receiptUrl      String?                          // comprovante (Pix manual)
  receiptNotes    String?
  kiwifyOrderId   String?  @unique                 // ID pedido Kiwify
  kiwifyChargeId  String?
  status          String   @default("pending")     // pending | approved | rejected
  reviewedAt      DateTime?
  reviewedBy      String?
  reviewNotes     String?
  licenseKey      String?  @unique                 // chave PRO (crypto 32-hex)
  deviceId        String?
  activatedAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([status])
  @@index([buyerEmail])
  @@index([kiwifyOrderId])
}

model AdEvent {
  id        String   @id @default(cuid())
  adId      String
  eventType String   // view | click
  createdAt DateTime @default(now())

  @@index([adId, eventType])
}

model Feedback {
  id        String   @id @default(cuid())
  rating    Int      // 1-5
  message   String
  userAgent String?
  page      String?
  createdAt DateTime @default(now())
}
```

### IndexedDB (Dexie) — cliente (celular do entregador)

```typescript
// Banco "MeuCorreDB" v2

deliveries: {
  id:         number  // auto-incremento
  app:        string  // chave do DeliveryApp
  value:      number  // R$ (ex: 22.50)
  km:         number
  date:       string  // YYYY-MM-DD (fuso local)
  timestamp:  number  // epoch ms
  notes?:     string
}

expenses: {
  id:          number
  category:    ExpenseCategory  // combustivel | alimentacao | manutencao | bateria | pedagio | outros
  value:       number
  description?: string
  date:        string
  timestamp:   number
}

apps: {
  id:         number
  name:       string  // chave única (ex: "ifood", "uber-eats")
  label:      string
  color:      string  // hex
  emoji:      string
  image?:     string  // data URL base64 (256x256 JPEG)
  isDefault?: boolean // true se built-in (não exclui, só oculta)
  hidden?:    boolean
  order?:     number
}
```

---

## 🔑 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (ou configure na Vercel):

```bash
# ===== Supabase (Postgres) =====
# Pooler URL (Session mode, porta 5432) — usada pela app em runtime
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres"

# ===== Admin =====
ADMIN_EMAIL="clodoaldo608@gmail.com"
ADMIN_PASSWORD="SuaSenhaForteAqui"

# ===== Pix (fallback manual, se Kiwify indisponível) =====
PIX_KEY="meucorre@pix.com.br"
PIX_MERCHANT_NAME="MeuCorre"
PLAN_PRICE=18.90

# ===== Kiwify =====
KIWIFY_PRODUCT_ID=""                          # ID interno do produto (opcional)
KIWIFY_WEBHOOK_SECRET="seu_webhook_secret"    # Token do webhook
NEXT_PUBLIC_KIWIFY_PRODUCT_SLUG="bknZCSZ"     # Slug do produto (URL checkout)
```

> ⚠️ **NUNCA** commite o `.env` no Git. O `.gitignore` já exclui ele.

---

## 🚀 Como Rodar Localmente

### Pré-requisitos

- Node.js 18+ ou Bun
- Uma conta no Supabase (grátis) — ou outro Postgres
- (Opcional) Uma conta na Kiwify pra pagamentos

### Passo a passo

```bash
# 1. Clone o repositório
git clone https://github.com/clodoaldosilva608/MeuCorre.git
cd MeuCorre

# 2. Instale as dependências
bun install
# ou: npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais (Supabase, admin, Kiwify)

# 4. Crie as tabelas no Postgres
bun run db:push
# ou: npx prisma db push

# 5. Gere o Prisma Client
bun run db:generate
# ou: npx prisma generate

# 6. Rode o projeto em desenvolvimento
bun run dev
# ou: npm run dev

# 7. Abra http://localhost:3000
```

### Scripts disponíveis

| Script | O que faz |
|---|---|
| `bun run dev` | Servidor de desenvolvimento (http://localhost:3000) |
| `bun run build` | Build de produção |
| `bun run start` | Servidor de produção |
| `bun run lint` | ESLint |
| `bun run db:push` | Cria/atualiza schema no Postgres |
| `bun run db:generate` | Gera Prisma Client |
| `bun run db:migrate` | Cria migration |
| `bun run db:reset` | Reseta banco (cuidado!) |

---

## 🌐 Deploy em Produção

### Opção 1: Vercel (recomendado)

1. Faça push do código para o GitHub
2. Acesse https://vercel.com → New Project → importe o repo
3. Framework: Next.js (auto-detectado)
4. Configure as env vars (lista acima)
5. Deploy — Vercel instala deps, roda `prisma generate && next build`, faz deploy

### Opção 2: Vercel CLI

```bash
npm install -g vercel
vercel login
vercel link --project meucorre
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production
vercel env add ADMIN_EMAIL production
vercel env add ADMIN_PASSWORD production
# ... adicione todas as outras
vercel deploy --prod
```

### Configurações importantes

- **Framework**: Next.js
- **Build Command**: `prisma generate && next build` (já no `package.json`)
- **Install Command**: `bun install` ou `npm install`
- **Node.js Version**: 20+ (Vercel usa 20 por padrão)

---

## 📖 Manual de Uso — App do Entregador

### 1. Acessando o app

1. Abra `https://meucorre.vercel.app/app` no navegador do celular
2. **Instale como app**: Chrome (Android) → menu ⋮ → "Adicionar à tela inicial" | Safari (iOS) → Compartilhar → "Adicionar à Tela de Início"
3. O ícone ⚡ MeuCorre aparece junto dos outros apps

### 2. Primeiros 14 dias (Trial grátis)

- Ao abrir pela primeira vez, você tem **14 dias de acesso total** (trial)
- Sem limites de lançamentos
- Sem anúncios (ou com anúncios se houver parceiros cadastrados)

### 3. Após o trial (Plano gratuito)

- **5 lançamentos de corrida por dia** (limite)
- Despesas continuam ilimitadas
- Gráficos continuam acessíveis
- Aparecerá um pop-up pedindo pra fazer upgrade pro PRO

### 4. Lançando uma corrida

1. Toque no botão **+** (verde, canto inferior direito)
2. Selecione o **app** (iFood, 99Food, Lalamove, etc.) — toque no card
3. Digite o **valor** (ou use os botões rápidos R$ 5/10/15/20/25/30)
4. Digite os **km** rodados (opcional)
5. Adicione uma **observação** se quiser (ex: "bairro Centro")
6. Toque em **Lançar Corrida**

### 5. Captura por notificação (atalho)

1. Toque no **sininho 🔔** no header
2. Cole o texto da notificação do app (ex: "iFood: Pedido entregue! Você recebeu R$ 15,50")
3. O MeuCorre extrai automaticamente o **app** e o **valor**
4. Confirme e lance

### 6. Lançando uma despesa

1. Toque na tab **Despesas** (inferior)
2. Toque no botão **+** (vermelho)
3. Selecione a **categoria** (Combustível ⛽, Alimentação 🍔, Manutenção 🔧, Bateria 🔋, Pedágio 🚧, Outros 💸)
4. Digite o valor
5. Adicione descrição (opcional)
6. Toque em **Lançar Despesa**

### 7. Vendo gráficos

- Toque na tab **Gráficos** (inferior)
- Veja:
  - **Área**: ganhos vs despesas dos últimos 7 dias
  - **Pizza**: distribuição de ganhos por app (com %)
  - **Barras**: despesas por categoria

### 8. Mudando o tema

- Toque no botão **Sol/Lua** no header
- Alterna entre claro e escuro (persistente)

### 9. Compartilhando com amigos

- Toque no botão **Share** no header
- Escolha: WhatsApp, Facebook, Twitter/X, Telegram
- Ou use o compartilhamento nativo do celular
- Ou copie o link

### 10. Exportando seus dados

- Toque no botão **Download** no header
- Escolha: **JSON** (backup completo) ou **CSV** (abre no Excel/Sheets)

### 11. Ativando PRO (após comprar)

1. Compre na landing page (`/`)
2. Após pagamento, você é redirecionado pra `/obrigado` e depois pro `/app` com a licença ativada automaticamente
3. Se não ativou sozinho: toque no **👑 Coroa** no header → cole a licença (veio por email) → **Ativar PRO**
4. Pronto! Badge "PRO" aparece no header, anúncios somem, features liberadas

---

## 🛠️ Manual de Uso — Painel Admin

### Acesso

- URL: `https://meucorre.vercel.app/admin/login`
- Email: `clodoaldo608@gmail.com`
- Senha: configurada em `ADMIN_PASSWORD`

### Dashboard (`/admin/dashboard`)

- **Receita total** somada das assinaturas aprovadas
- **Vendas aprovadas/pendentes**
- **Avaliação média** dos feedbacks
- **CTR** dos anúncios (cliques / views)
- Atalhos rápidos pra criar anúncio, revisar vendas, ler feedbacks

### Anúncios (`/admin/ads`)

#### Criar novo anúncio

1. Toque em **Novo anúncio**
2. Selecione o **placement**:
   - **Banner no topo**: faixa horizontal no topo do dashboard (dismissível)
   - **Card entre listas**: card patrocinado entre as corridas (badge "Patrocinado")
   - **Splash patrocinado**: banner na splash screen (alta visibilidade)
3. Preencha:
   - **Título** (ex: "Oficina do João - 10% off")
   - **Descrição** (ex: "Troca de óleo com desconto pra entregadores")
   - **CTA** (texto do botão, ex: "Agendar")
   - **URL** (link de destino)
   - **URL da imagem** (logo do parceiro, opcional)
   - **Cores** (fundo + texto — use os color pickers)
4. Veja o **preview** ao vivo
5. **Ativo**: switch ligado/desligado
6. Toque em **Criar anúncio**

#### Editar / Excluir / Ativar

- Toque no **lápis** pra editar
- Toque na **lixeira** pra excluir (com confirmação)
- Use o **switch** pra ativar/desativar sem excluir

#### Estatísticas

- Cada anúncio mostra **views** e **cliques**
- Stats globais no topo: Total, Ativos, Visualizações, Cliques

### Assinaturas (`/admin/subscriptions`)

#### Lista de assinaturas

- Filtros: **Pendentes** | **Aprovadas** | **Rejeitadas** | **Todas**
- Stats: Total, Pendentes, Aprovadas, Receita
- Cada item mostra: nome, email, telefone, cidade, data, valor, status

#### Aprovar (gera licença)

1. Toque em **Revisar** num item pendente
2. Veja o comprovante (se foi upload manual)
3. Adicione **notas** (visíveis ao cliente)
4. Toque em **Aprovar e gerar licença**
5. Licença crypto 32-hex é gerada automaticamente
6. Copie com o botão **Copiar**
7. Envie pro cliente (por email ou WhatsApp)

> ℹ️ **Compras via Kiwify são auto-aprovadas** pelo webhook — você não precisa fazer nada. Esse fluxo manual é só pra compras via Pix direto (sem Kiwify).

#### Rejeitar

1. Toque em **Revisar**
2. Adicione motivo nas notas
3. Toque em **Rejeitar**

### Feedbacks (`/admin/feedback`)

- Lista todos os feedbacks enviados pelos usuários
- Filtros por nota (5⭐, 4⭐, 3⭐, 2⭐, 1⭐)
- Stats: Total, Nota média, 5 estrelas, 1 estrela
- Cada item mostra: estrelas, mensagem, página de origem, data, user agent
- Excluir feedbacks (com confirmação)

---

## 💳 Integração Kiwify (Pagamentos)

### Fluxo completo

```
1. Cliente acessa a landing page
2. Clica em "Comprar plano vitalício" (R$ 18,90)
3. Preenche nome + email
4. É redirecionado pra https://pay.kiwify.com.br/bknZCSZ?email=...&name=...
5. Paga na Kiwify (Pix aprova em segundos, cartão é imediato)
6. Kiwify dispara webhook POST pra /api/webhooks/kiwify
   - Valida token (header X-Kiwify-Signature ou query ?token=)
   - Cria assinatura aprovada no Postgres
   - Gera licença crypto 32-hex
7. Kiwify redireciona cliente pra /obrigado
8. Página /obrigado faz polling em /api/license/by-order
   - Tenta order_id, order_ref, charge_id, etc da URL
   - Fallback por email (se vier na URL)
   - Polling de 3s até 20x (60s) — dá tempo do webhook chegar
9. Quando acha licença:
   - Mostra na tela
   - Auto-redirect pra /app?license=XXX após 4s
10. App detecta ?license=xxx → ativa PRO automaticamente
11. Badge "PRO" aparece no header, anúncios somem
```

### Configuração na Kiwify

1. **Criar produto**:
   - Nome: "MeuCorre PRO — Plano Vitalício"
   - Tipo: Digital
   - Preço: R$ 18,90 (oferta de lançamento)
   - Pagamento: Pix + Cartão

2. **Configurar Thank You Page**:
   - URL: `https://meucorre.vercel.app/obrigado`

3. **Configurar Webhook**:
   - URL: `https://meucorre.vercel.app/api/webhooks/kiwify`
   - Eventos: `compra_aprovada` (e `compra_reembolsada`)
   - Token: crie um secret forte, configure em `KIWIFY_WEBHOOK_SECRET`

4. **Copiar slug do produto**:
   - Vai na aba Links do produto
   - O slug é a parte final do URL: `https://pay.kiwify.com.br/XXXX` → `XXXX`
   - Configure em `NEXT_PUBLIC_KIWIFY_PRODUCT_SLUG`

### Validação do webhook

O endpoint `/api/webhooks/kiwify` valida o token via:
- Header `X-Kiwify-Signature: <token>`
- Ou query `?token=<token>`

Se o token não bater com `KIWIFY_WEBHOOK_SECRET`, retorna 401.

### Idempotência

O webhook é **idempotente**: se a Kiwify reenviar o mesmo `order_id` (retries), o endpoint retorna `{"ok":true,"idempotent":true}` sem criar duplicata.

### Reembolso

Se o webhook receber `order_status: "refunded"`, a assinatura é marcada como `rejected` com nota "Reembolsado via Kiwify".

---

## 📡 API Reference

### APIs públicas (sem auth)

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/api/ads?placement=banner_top` | Lista anúncios ativos e vigentes |
| POST | `/api/ads/[id]/click` | Registra clique no anúncio |
| POST | `/api/subscription` | Cria compra Pix manual (pending) |
| GET | `/api/subscription?id=xxx` | Consulta status de compra |
| POST | `/api/subscription/[id]/receipt` | Upload comprovante Pix |
| POST | `/api/license/verify` | Valida licença PRO |
| GET | `/api/license/by-order?order=xxx&email=xxx` | Busca licença por order_id ou email |
| POST | `/api/feedback` | Recebe feedback (rating + message) |
| POST | `/api/webhooks/kiwify` | Webhook Kiwify (auto-aprova) |

### APIs admin (auth por cookie)

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/admin/login` | Login (email + senha) |
| POST | `/api/admin/logout` | Logout |
| GET | `/api/admin/dashboard` | Estatísticas gerais |
| GET | `/api/admin/ads` | Lista todos anúncios |
| POST | `/api/admin/ads` | Cria anúncio |
| PATCH | `/api/admin/ads/[id]` | Atualiza anúncio |
| DELETE | `/api/admin/ads/[id]` | Exclui anúncio |
| GET | `/api/admin/subscriptions?status=X` | Lista assinaturas |
| POST | `/api/admin/subscriptions` | Aprovar/rejeitar |
| GET | `/api/admin/feedback` | Lista feedbacks |
| DELETE | `/api/admin/feedback?id=xxx` | Exclui feedback |

---

## 🗺️ Roadmap

### v2.1 (próxima)
- [ ] Notificação push para renovação de manutenção
- [ ] Gráfico de ganhos por hora do dia
- [ ] Drag-and-drop pra reordenar apps
- [ ] Modo claro refinado (aindamais polido)
- [ ] Backup em nuvem PRO (Supabase Storage)

### v3.0 (futuro)
- [ ] App Android nativo (TWA) com Notification Listener API
- [ ] Captura 100% automática de corridas (sem digitar)
- [ ] Sincronização entre dispositivos
- [ ] Metas diárias/semanais com gamificação
- [ ] Relatórios PDF mensais

### v3.1 (monetização avançada)
- [ ] Webhook Mercado Pago (auto-aprovar Pix sem Kiwify)
- [ ] Cupons de desconto
- [ ] Programa de afiliados
- [ ] Integração com calculadora de IR

---

## 🔒 Segurança

### Práticas implementadas

- ✅ **Cookies httpOnly** pra auth admin (não acessíveis por JS)
- ✅ **SameSite=Lax** + Secure em produção
- ✅ **Validação de token** no webhook Kiwify (header ou query)
- ✅ **Idempotência** por `kiwifyOrderId` (sem duplicatas)
- ✅ **Variáveis sensíveis** apenas no servidor (Vercel env vars)
- ✅ **`.env` no `.gitignore`** (nunca commitado)
- ✅ **Postgres** com connection pooler (Supavisor)
- ✅ **Licenças crypto** (32-hex random) — não adivinháveis

### Recomendações pós-deploy

1. **Troque a senha admin** `Silva88677488@#` pra uma forte (16+ chars) — atualize em `ADMIN_PASSWORD` na Vercel
2. **Regenere o token Vercel** após setup (https://vercel.com/account/tokens)
3. **Rotacione tokens Supabase** periodicamente (https://supabase.com/dashboard/project/PROJECT_REF/settings/api)
4. **Monitore logs** da Vercel pra detectar tentativas de ataque
5. **Backup do Postgres**: Supabase faz backup automático diário (plano grátis: 7 dias)

### O NÃO fazer

- ❌ Nunca commitar `.env` no Git
- ❌ Nunca compartilhar senhas/tokens em canais públicos
- ❌ Nunca usar a senha admin em ambientes não-production sem trocar depois
- ❌ Nunca expor `service_role` do Supabase no client-side

---

## 📄 Licença

MIT License — use livremente para seu próprio app de entregadores.

---

## 👨‍💻 Créditos

**Criado e desenvolvido por:**
**Clodoaldo C Silva** 🇧🇷

Feito com 💚 pra quem corre atrás 🏍️📦

---

## 🆘 Suporte

- **App**: https://meucorre.vercel.app
- **Painel admin**: https://meucorre.vercel.app/admin/login
- **Repositório**: https://github.com/clodoaldosilva608/MeuCorre

Encontrou um bug? Tem uma sugestão? Abra uma issue no GitHub ou mande feedback pelo app (pop-up de feedback aparece automaticamente após 3 corridas lançadas).
