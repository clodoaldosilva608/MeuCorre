# ⚡ MeuCorre — PWA para Entregadores

Aplicativo web progressivo (PWA) para entregadores de aplicativo controlarem corridas, ganhos, despesas e lucro líquido em um só lugar. **100% offline, dados ficam só no celular do entregador** — arquitetura Local-First.

## 🚀 Funcionalidades

### v2 (atual) — Implementada
- **Controle de despesas**: lançar gastos por categoria (combustível, alimentação, manutenção, bateria, pedágio, outros)
- **Lucro líquido**: card destacado mostrando `ganhos - despesas` (verde quando positivo, vermelho quando negativo)
- **Gráficos Recharts**:
  - Área: ganhos vs despesas dos últimos 7 dias
  - Pizza: distribuição de ganhos por app (com legenda e percentuais)
  - Barras: despesas por categoria
- **CRUD de apps de entrega**: cadastrar, editar, ocultar e excluir apps; cada app pode ter **imagem oficial** (upload que é redimensionado e salvo como base64 no IndexedDB)
- **Captura por notificação**: cole o texto da notificação do app (iFood, 99Food, Lalamove, etc.) e o MeuCorre extrai automaticamente o app e o valor via parser regex
- **Navegação por tabs**: Corridas / Despesas / Gráficos (bottom nav mobile)

### v1 (MVP) — Implementada
- **Lançamento rápido**: modal "Nova Corrida" com botões de valor rápido (R$ 5/10/15/20/25/30)
- **Dashboard em tempo real**: total em R$, lucro líquido, número de corridas e quilometragem
- **Resumo por app**: barras visuais mostrando quanto cada plataforma rendeu (com imagem/emoji)
- **Filtro de período**: Hoje / Semana / Mês / Tudo
- **Histórico recente**: últimas 10 corridas com horário, km, valor, editar e excluir
- **Editar e excluir**: correção rápida sem perder o histórico
- **Exportar dados**: backup em JSON (corridas + despesas + apps) ou CSV
- **Toast de feedback**: confirmação visual ao lançar/editar/excluir
- **Splash screen com mascote "Foguetinho"**: loading amigável ao abrir o app

### Arquitetura Local-First
- **Zero servidor**: dados ficam no `IndexedDB` do navegador via Dexie.js
- **Funciona offline**: Service Worker cacheia o app shell
- **Privacidade total**: nenhum dado sai do celular do entregador
- **Instalável**: aparece na tela inicial como app nativo (sem passar por lojas)

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript 5 |
| UI | Tailwind CSS 4 + shadcn/ui + Lucide icons |
| Animações | Framer Motion |
| Banco local | IndexedDB via Dexie.js + dexie-react-hooks |
| Gráficos | Recharts |
| PWA | manifest.json + Service Worker próprio |
| Tema | Dark mode (zinc-950 + emerald-400) |

## 📱 Identidade Visual

- **Cores**: fundo `#09090b` (zinc-950) + acento `#10b981` (emerald-500) para ganhos e `#ef4444` (red-500) para despesas
- **Ícone do app**: squircle esmeralda com raio ⚡ branco
- **Mascote**: "Foguetinho" — foguete estilizado SVG prata/esmeralda (splash screen)
- **FAB**: botão flutuante verde (corridas) ou vermelho (despesas) com `+` branco
- **Layout**: mobile-first, `max-w-md`, touch targets generosos (44px+), bottom nav

## 📦 Estrutura do Projeto

```
src/
├── app/
│   ├── layout.tsx          # Metadata PWA, Toaster, registro do SW
│   ├── page.tsx            # Página principal (compõe tudo + tabs)
│   └── globals.css
├── components/
│   ├── meucorre/
│   │   ├── header.tsx              # Cabeçalho + menu backup/apps/notificação
│   │   ├── summary-cards.tsx       # Cards Total / Lucro Líquido / Corridas / KM
│   │   ├── period-filter.tsx       # Toggle Hoje/Semana/Mês/Tudo
│   │   ├── app-summary.tsx         # Barras por app (com imagem)
│   │   ├── delivery-list.tsx       # Últimas corridas
│   │   ├── delivery-form.tsx       # Modal Nova/Editar corrida (grid de apps)
│   │   ├── expense-form.tsx        # Modal Nova/Editar despesa
│   │   ├── expense-list.tsx        # Últimas despesas
│   │   ├── app-manager.tsx         # CRUD de apps + upload imagem
│   │   ├── notification-capture.tsx # Captura por notificação com parse
│   │   ├── charts.tsx              # 3 gráficos Recharts
│   │   ├── bottom-nav.tsx          # Nav inferior (tabs)
│   │   ├── fab.tsx                 # Botão flutuante +
│   │   └── splash-screen.tsx       # Splash com Foguetinho
│   └── ui/                  # shadcn/ui components
├── hooks/
│   └── use-deliveries.ts    # Hooks: useApps, useDeliveries, useExpenses + stats
└── lib/
    ├── db.ts                # Dexie.js schema v2 (deliveries + expenses + apps)
    ├── types.ts             # Tipos TypeScript
    └── apps.ts              # Apps DB + formatters + parseNotification + resizeImage

public/
├── manifest.json            # PWA manifest
├── sw.js                    # Service Worker (offline)
├── icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
└── favicon-32.png
```

## 🗄️ Schema do Banco Local (v2)

```typescript
// IndexedDB via Dexie — database "MeuCorreDB" v2

deliveries: {
  id:         number  // auto-incremento
  app:        string  // nome (chave) do DeliveryApp
  value:      number  // R$ (ex: 22.50)
  km:         number  // quilometragem (ex: 4.2)
  date:       string  // YYYY-MM-DD (fuso local)
  timestamp:  number  // epoch ms
  notes?:     string  // observação opcional
}

expenses: {
  id:          number
  category:    ExpenseCategory // combustivel | alimentacao | manutencao | bateria | pedagio | outros
  value:       number
  description?: string
  date:        string  // YYYY-MM-DD
  timestamp:   number
}

apps: {
  id:         number
  name:       string  // chave única (ex: "ifood", "uber-eats")
  label:      string  // nome exibido
  color:      string  // cor hex
  emoji:      string  // emoji fallback
  image?:     string  // data URL base64 (256x256 JPEG)
  isDefault?: boolean // true se built-in (não pode excluir, só ocultar)
  hidden?:    boolean // true se oculto
  order?:     number  // ordem de exibição
}
```

Apps padrão (seed): iFood, 99Food, Lalamove, Rappi, Loggi, Independente/Outros.

## 🔔 Captura por Notificação

O MeuCorre implementa um parser de notificações que extrai automaticamente:
1. **App**: detecta pelo nome do app no texto (case-insensitive, com e sem acentos)
2. **Valor**: suporta formatos `R$ 15,50`, `R$ 1.234,56`, `R$15.50`, `15,50`, `15.50`

**Como usar**:
1. Toque no ícone 🔔 no header
2. Cole o texto da notificação (ex: "iFood: Pedido entregue! Você recebeu R$ 15,50")
3. O app preenche automaticamente app + valor — confirme e lance

**Sobre a Notification Listener API nativa**: PWAs web não podem ler notificações de outros apps diretamente (limitação de segurança do navegador). Para a versão 3.0, está planejado um app Android wrapper que usa a Notification Listener API nativa do Android para preenchimento 100% automático.

## 🧪 Como Rodar Localmente

```bash
# instalar dependências
bun install

# modo desenvolvimento (http://localhost:3000)
bun run dev

# lint
bun run lint
```

## 📲 Como Instalar no Celular

### Android (Chrome)
1. Acesse a URL do app no Chrome
2. Menu (⋮) → **"Adicionar à tela inicial"**
3. O ícone ⚡ MeuCorre aparece junto dos outros apps
4. Abre em tela cheia, sem barra do navegador

### iOS (Safari)
1. Acesse a URL no Safari
2. Botão compartilhar → **"Adicionar à Tela de Início"**

> **Importante**: PWAs precisam de HTTPS para instalação. Em produção, hospede em Vercel, Netlify ou Cloudflare Pages.

## 🚢 Deploy

### Vercel (recomendado)
```bash
vercel --prod
```

## 🔮 Roadmap

### v2.1 — Melhorias
- Reordenar apps (drag-and-drop)
- Backup automático em nuvem criptografada (opcional)
- Gráfico de ganhos por hora do dia
- Modo claro (light theme)

### v3.0 — Auto-fill nativo
- App Android wrapper (TWA) com Notification Listener API
- Captura 100% automática: quando uma corrida termina no iFood/99Food, a notificação é parseada e o usuário só confirma
- Sincronização entre dispositivos

### v3.1 — Modo PRO (Monetização)
- Assinatura R$ 9,90/mês
- Relatórios PDF mensais
- Metas diárias/semanais
- Lembretes de manutenção do veículo
- Integração com calculadora de IR

## 💡 Decisões Arquiteturais

**Por que PWA em vez de React Native / Flutter nativo?**
- Zero burocracia de lojas (Play Store / App Store)
- Atualização instantânea (sem revisão de app)
- Custo zero de infraestrutura no MVP
- Funciona offline desde o dia 1

**Por que IndexedDB e não localStorage?**
- Suporta consultas complexas (filtros por data, agrupamento por app)
- Capacidade muito maior (GBs vs 5MB)
- Transacional e performático com Dexie.js

**Por que imagens como base64 no IndexedDB?**
- Mantém o princípio Local-First (não depende de URLs externas)
- Funciona offline
- Imagens são redimensionadas para 256x256 JPEG antes de salvar (economiza espaço)
- Cada app pode ter sua imagem oficial (upload do usuário)

**Por que parser de notificação via regex em vez de API nativa?**
- PWAs web não podem ler notificações de outros apps (limitação de segurança)
- O parser via regex é uma solução pragmática: o usuário cola a notificação, o app faz o trabalho pesado
- Para v3.0, está planejado um wrapper Android nativo que usa a Notification Listener API

## 📄 Licença

MIT — use livremente para seu próprio app de entregadores.

---

⚡ **MeuCorre** — construído com amor para quem corre atrás 🏍️📦
