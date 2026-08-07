# ⚡ MeuCorre — PWA para Entregadores

Aplicativo web progressivo (PWA) para entregadores de aplicativo (iFood, 99Food, Lalamove, Rappi, Loggi e independentes) controlarem corridas, ganhos e quilometragem em um só lugar. **100% offline, dados ficam só no celular do entregador** — arquitetura Local-First.

## 🚀 Funcionalidades

### Versão 1 (MVP) — implementada
- **Lançamento rápido**: modal "Nova Corrida" com botões de valor rápido (R$ 5/10/15/20/25/30)
- **Dashboard em tempo real**: total em R$, número de corridas e quilometragem do período
- **Resumo por app**: barras visuais mostrando quanto cada plataforma rendeu
- **Filtro de período**: Hoje / Semana / Mês / Tudo
- **Histórico recente**: últimas 10 corridas com horário, km, valor, editar e excluir
- **Editar e excluir**: correção rápida sem perder o histórico
- **Exportar dados**: backup em JSON ou CSV (abre no Excel/Google Sheets)
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
| PWA | manifest.json + Service Worker próprio |
| Tema | Dark mode (zinc-950 + emerald-400) |

## 📱 Identidade Visual

- **Cores**: fundo `#09090b` (zinc-950) + acento `#10b981` (emerald-500) para dinheiro/ganhos
- **Ícone do app**: squircle esmeralda com raio ⚡ branco
- **Mascote**: "Foguetinho" — foguete estilizado SVG prata/esmeralda (splash screen)
- **FAB**: botão flutuante verde esmeralda com `+` branco, sempre acessível
- **Layout**: mobile-first, `max-w-md`, touch targets generosos (44px+)

## 📦 Estrutura do Projeto

```
src/
├── app/
│   ├── layout.tsx          # Metadata PWA, Toaster, registro do SW
│   ├── page.tsx            # Página principal (compõe tudo)
│   └── globals.css
├── components/
│   ├── meucorre/
│   │   ├── header.tsx          # Cabeçalho fixo + menu backup
│   │   ├── summary-cards.tsx   # Cards Total / Corridas / KM
│   │   ├── period-filter.tsx   # Toggle Hoje/Semana/Mês/Tudo
│   │   ├── app-summary.tsx     # Barras por app
│   │   ├── delivery-list.tsx   # Últimas corridas
│   │   ├── delivery-form.tsx   # Modal Nova/Editar corrida
│   │   ├── fab.tsx             # Botão flutuante +
│   │   └── splash-screen.tsx   # Splash com Foguetinho
│   └── ui/                  # shadcn/ui components
├── hooks/
│   └── use-deliveries.ts    # CRUD + estatísticas + export
└── lib/
    ├── db.ts                # Dexie.js schema (deliveries)
    ├── types.ts             # Tipos TypeScript
    └── apps.ts              # Apps suportados + formatação BRL/datas pt-BR

public/
├── manifest.json            # PWA manifest
├── sw.js                    # Service Worker (offline)
├── icon-192.png             # App icon 192x192
├── icon-512.png             # App icon 512x512
├── icon-maskable-512.png    # Maskable icon (Android adaptativo)
├── apple-touch-icon.png     # iOS icon
└── favicon-32.png
```

## 🗄️ Schema do Banco Local

```typescript
// IndexedDB via Dexie — database "MeuCorreDB"
deliveries: {
  id:         number  // auto-incremento
  app:        AppName // iFood | 99Food | Lalamove | Rappi | Loggi | Independente/Outros
  value:      number  // R$ (ex: 22.50)
  km:         number  // quilometragem (ex: 4.2)
  date:       string  // YYYY-MM-DD (fuso local)
  timestamp:  number  // epoch ms
  notes?:     string  // observação opcional
}
```

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
3. Ícone aparece na home

> **Importante**: PWAs precisam de HTTPS para instalação. Em produção, hospede em Vercel, Netlify ou Cloudflare Pages (todos gratuitos com HTTPS automático).

## 🚢 Deploy

### Vercel (recomendado)
```bash
vercel --prod
```

### Build estático
```bash
bun run build
# output em .next/standalone
```

## 🔮 Roadmap (Próximas Versões)

### v1.1 — Controle de Despesas
- Lançar gastos (combustível, alimentação, manutenção)
- Calcular lucro líquido (ganhos - despesas)

### v1.2 — Gráficos e Relatórios
- Gráfico de ganhos por dia/semana/mês (Recharts já instalado)
- Comparativo entre apps
- Análise de R$/km e R$/hora

### v2.0 — Auto-fill via Notificações
- Notification Listener API (Android) para ler corridas automaticamente
- O entregador só confirma os dados pré-preenchidos

### v2.1 — Modo PRO (Monetização)
- Assinatura R$ 9,90/mês
- Relatórios PDF, sincronização entre dispositivos, backup em nuvem criptografado

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

**Por que Dexie.js e não IndexedDB puro?**
- API reativa (`useLiveQuery` atualiza UI automaticamente)
- Schema versionado (migrations automáticas)
- Promises nativas (sem callbacks verbose)

## 📄 Licença

MIT — use livremente para seu próprio app de entregadores.

---

⚡ **MeuCorre** — construído com amor para quem corre atrás 🏍️📦
