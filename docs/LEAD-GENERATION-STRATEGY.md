# Estratégia de Captação de Leads — MeuCorre

> Análise de **validasaas.app** e **onya.life** + proposta de implementação para o MeuCorre

---

## 📊 Análise dos Sites de Referência

### 1. ValidaSaaS (validasaas.app)

**Posicionamento:** "A gente acha seu micro-SaaS de renda recorrente" — ferramenta que valida ideias de micro-SaaS com pesquisa real de mercado.

**Funil de captação identificado:**

| Etapa | Mecanismo | Implementação MeuCorre |
|-------|-----------|----------------------|
| **Landing** | Headline forte + prova social ("+1.000 análises") | ✅ Já temos ("PARE DE PERDER DINHEIRO SEM SABER!") |
| **Quiz interativo** | `/quiz` — 4 perguntas segmentadas (perfil, meta de renda, trava, ideia) | 🆕 **Criar quiz "Qual é o seu perfil de entregador?"** |
| **Resultado personalizado** | Mostra análise baseada nas respostas + CTA para validação | 🆕 **Resultado: "Você está perdendo R$ X por semana"** |
| **Preço destacado** | R$ 97 (vitalício) | ✅ Já temos (R$ 18,90 vitalício) |
| **Prova social numérica** | "+1.000 análises já feitas" | 🆕 **Adicionar contador "X entregadores usando"** |
| **CTA final** | "Validar meu projeto" → captura email | 🆕 **"Baixar grátis" → captura email + WhatsApp** |

**Padrões identificados no HTML:**
- 46 menções a preço/grátis/vitalício
- 2 provas sociais
- 0 formulários visíveis no HTML inicial (quiz é renderizado no client)
- Link `/quiz` como CTA principal (não `/login`)

### 2. Onya (onya.life)

**Posicionamento:** "Sua saúde, mais inteligente" — app de acompanhamento de saúde/diabetes.

**Funil de captação identificado:**

| Etapa | Mecanismo | Implementação MeuCorre |
|-------|-----------|----------------------|
| **Landing** | Hero com "Começar gratuitamente" | ✅ Já temos |
| **Login com Google** | Botão "Cadastrar com Google" (OAuth rápido) | 🆕 **Adicionar Google OAuth** |
| **Form de registro curto** | Nome + Email + Celular + Senha (4 campos) | ✅ Já temos similar |
| **Segmentação por persona** | "Para quem é o Onya?" (Diabético, Gestante, Cuidador, Atleta) | 🆕 **"Para quem é o MeuCorre?" (iFood, 99Food, Lalamove, etc)** |
| **PWA install prompt** | `beforeinstallprompt` capturado + evento custom | ✅ Já temos |
| **Pixel de tracking** | Facebook Pixel + Microsoft Clarity | 🆕 **Adicionar Meta Pixel + GA4** |
| **WhatsApp** | 1 link de WhatsApp | ✅ Já temos (contato) |

**Padrões identificados no HTML:**
- 11 botões CTA
- 1 link WhatsApp
- 7 menções a preço
- 1 elemento de urgência/escassez
- 1 popup/modal

---

## 🎯 Estratégia Proposta para MeuCorre

### Funil de Conversão em 5 Etapas

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  1. Landing │ ──> │ 2. Quiz Lead │ ──> │ 3. App Grátis│ ──> │ 4. Trial 14d │ ──> │ 5. Vitalício│
│  (anônimo)  │     │  (captura    │     │  (sem login) │     │  (PRO ativo) │     │  R$ 18,90   │
│             │     │   email+tel) │     │              │     │              │     │  (pix/cartão)│
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘     └─────────────┘
                           │                                                              │
                           └──────────────────Loop de indicação──────────────────────────┘
                                              (R$ 5 por amigo PRO)
```

---

### Etapa 1: Landing Page Otimizada (✅ parcialmente feito)

**Melhorias propostas:**

1. **Contador dinâmico de usuários** (prova social numérica)
   ```tsx
   // Buscar de /api/lifetime-status (já existe)
   // Mostrar: "🔥 2.847 entregadores usando agora"
   ```

2. **Quiz CTA no hero** (substituir "Baixar grátis" por quiz primeiro)
   - Botão primário: **"Descubra quanto você está perdendo"** → `/quiz`
   - Botão secundário: **"Baixar grátis"** → `/app`
   - Racional: quiz captura email antes do app, permitindo retargeting

3. **Segmentação por persona** (estilo Onya)
   - Seção "Para quem é o MeuCorre?" com 4 cards:
     - 🛵 **Entregador de iFood** — "Controle corridas e comissão"
     - 📦 **Motoboy de Lalamove/Loggi** — "Rastreie km e despesas"
     - 🚗 **Motorista de Uber/99** — "Lucro real por corrida"
     - 🛒 **Shopee/Mercado Livre** — "Multi-app em um só lugar"

4. **Exit-intent popup** (captura email antes de sair)
   ```tsx
   useEffect(() => {
     const handler = (e: MouseEvent) => {
       if (e.clientY <= 0) setExitPopupOpen(true);
     };
     document.addEventListener('mouseleave', handler);
     return () => document.removeEventListener('mouseleave', handler);
   }, []);
   ```

---

### Etapa 2: Quiz de Captação de Leads (🆕 novo)

**Roteiro do quiz (inspirado no ValidaSaaS):**

**Pergunta 1:** "Quantas corridas você faz por dia?"
- Menos de 5
- 5 a 10
- 10 a 20
- Mais de 20

**Pergunta 2:** "Qual app você mais usa?"
- iFood / 99Food / Lalamove / Rappi / Uber / Outro

**Pergunta 3:** "Você sabe quanto sobra no fim do dia?"
- Sim, controlo tudo
- Mais ou menos
- Não faço ideia ← *maioria*

**Pergunta 4:** "Qual sua maior dificuldade?"
- Controlar gasolina/despesas
- Saber qual app dá mais dinheiro
- Organizar multi-app
- Declarar imposto de renda

**Resultado personalizado:**
> "Com base nas suas respostas, você está perdendo **~R$ 180/semana** por não controlar despesas.
> O MeuCorre organiza tudo em 1 app. **Baixe grátis e comece hoje.**"

**Captura:** email + WhatsApp (opcional) antes de mostrar o resultado.

**Implementação técnica:**
- Nova rota: `/quiz` (página client-side)
- Salvar lead no Postgres: `model Lead { email, phone, quizAnswers, createdAt }`
- Disparar webhook para WhatsApp/email automation (n8n/Make)
- Redirecionar para `/app` após captura

---

### Etapa 3: App Grátis com Trial (✅ já existe)

- 14 dias de trial PRO automático
- 5 lançamentos/dia grátis para sempre
- Sem cartão de crédito
- Onboarding tutorial (✅ já implementado)

**Melhoria:** Após 7 dias de trial, enviar WhatsApp com "Faltam 7 dias do seu trial. Quer PRO vitalício por R$ 18,90?"

---

### Etapa 4: Conversão para Vitalício (🆕 melhorar)

**Gatilhos de conversão:**

1. **Trial expirando** (3 dias antes)
   - Toast no app: "Seu trial acaba em 3 dias. PRO vitalício por R$ 18,90 →"
   - WhatsApp: "Últimos 3 dias do trial. Garanta PRO por R$ 18,90 (vitalício)"

2. **Limite de 5 lançamentos atingido** (3ª vez)
   - Dialog: "Você atingiu o limite gratuito. PRO vitalício remove limites →"

3. **Após 10 corridas registradas** (momento de valor percebido)
   - Toast: "Você já registrou 10 corridas! PRO vitalício por R$ 18,90 →"

4. **Exit-intent no app** (quando fecha aba sem PRO)
   - Modal: "Antes de ir... PRO vitalício por R$ 18,90 (pagamento único)"

---

### Etapa 5: Loop de Indicação (✅ já existe, melhorar)

**Programa "Indique e Ganhe R$ 5":**

- Usuário PRO ganha R$ 5 (PIX) por cada amigo que vira PRO
- Link personalizado: `meucorre.vercel.app/?ref=MEUCORRE-ABC123`
- Dashboard com indicados, convertidos e ganhos

**Melhorias propostas (inspirado em ambos os sites):**

1. **WhatsApp share automático** (estilo Onya)
   ```
   "Bora ajudar a galera! 🛵
   Você tá usando o MeuCorre pra controlar corridas?
   Indica um colega entregador e ganha R$ 5 por cada um que virar PRO.
   Link: https://meucorre.vercel.app/?ref=MEUCORRE-ABC123"
   ```

2. **Gamificação** (badge de indicador)
   - 🥉 Bronze: 1-5 indicações
   - 🥈 Prata: 6-15
   - 🥇 Ouro: 16-30
   - 💎 Diamante: 31+
   - Mostrar badge no perfil + dashboard

3. **Bônus de período** (urgência/escassez)
   - "Indique 3 amigos este mês e ganhe R$ 20 extra (bônus de R$ 5)"

4. **Página de status pública** (prova social)
   - `/indicacoes/[code]` mostra: "X entregadores indicados, Y convertidos, R$ Z ganhos"

---

## 🔧 Implementação Técnica

### Novos modelos no Prisma

```prisma
// Lead capturado no quiz (antes de virar usuário)
model Lead {
  id           String   @id @default(cuid())
  email        String   @unique
  phone        String?
  quizAnswers  Json     // respostas do quiz
  resultScore  Int      // score de "quanto está perdendo"
  source       String   @default("quiz") // quiz | exit_intent | referral
  referrerCode String?  // quem indicou
  convertedAt  DateTime? // quando virou usuário (null = ainda não converteu)
  createdAt    DateTime @default(now())

  @@index([email])
  @@index([referrerCode])
  @@index([convertedAt])
}

// Webhook events (para automação de WhatsApp/email)
model WebhookEvent {
  id        String   @id @default(cuid())
  type      String   // lead_created | trial_expiring | referral_converted
  payload   Json
  sentAt    DateTime?
  createdAt DateTime @default(now())

  @@index([type, sentAt])
}
```

### Novas rotas API

| Rota | Método | Descrição |
|------|--------|-----------|
| `/api/quiz/submit` | POST | Salvar lead + retornar resultado personalizado |
| `/api/leads/stats` | GET | Admin: métricas de conversão |
| `/api/webhooks/lead` | POST | Webhook para n8n/Make (enviar WhatsApp) |
| `/api/referrals/leaderboard` | GET | Top indicadores (prova social) |

### Novas páginas

| Página | Descrição |
|--------|-----------|
| `/quiz` | Quiz interativo de captação |
| `/indicacoes/[code]` | Página pública de status de indicações |
| `/obrigado-quiz` | Página de obrigado pós-quiz com CTA app |

---

## 📈 Métricas Esperadas

Com base nos benchmarks de ValidaSaaS e Onya:

| Métrica | Atual | Meta (3 meses) |
|---------|-------|----------------|
| Taxa de conversão landing → quiz | 0% | 15-20% |
| Taxa de conversão quiz → app | 0% | 40-60% |
| Taxa de conversão trial → vitalício | ~5% | 12-18% |
| Indicações por usuário PRO | ~0.3 | 1.5-2.5 |
| CAC (Customer Acquisition Cost) | ~R$ 15 | ~R$ 3 (via referral) |

---

## 🚀 Plano de Implementação (Priorizado)

### Sprint 1 (1 semana) — Quick wins
- [ ] Adicionar contador dinâmico na landing ("X entregadores usando")
- [ ] Adicionar seção "Para quem é o MeuCorre?" com 4 personas
- [ ] Adicionar exit-intent popup na landing
- [ ] Melhorar CTAs de conversão no app (3 gatilhos)

### Sprint 2 (2 semanas) — Quiz de leads
- [ ] Criar página `/quiz` com 4 perguntas
- [ ] Criar modelo `Lead` no Prisma
- [ ] Criar API `/api/quiz/submit`
- [ ] Integrar com WhatsApp (n8n ou Z-API)
- [ ] Página de resultado personalizado

### Sprint 3 (1 semana) — Referral gamificado
- [ ] Badges de indicador (Bronze/Prata/Ouro/Diamante)
- [ ] Página pública `/indicacoes/[code]`
- [ ] WhatsApp share automático melhorado
- [ ] Bônus de período (urgência)

### Sprint 4 (1 semana) — Tracking e otimização
- [ ] Instalar Meta Pixel + GA4
- [ ] Dashboard admin de métricas de funil
- [ ] A/B test de headlines
- [ ] Automação de WhatsApp por gatilho (trial expirando, limite atingido)

---

## 💡 Insights Chave dos Sites Analisados

### Do ValidaSaaS:
1. **Quiz antes do app** = captura email mesmo de quem não converte imediatamente
2. **Resultado personalizado** = aumenta percepção de valor antes do pitch
3. **Preço vitalício destacado** = remove fricção de "assinatura" (ideal para MeuCorre)
4. **Prova social numérica** (+1.000 análises) = valida o produto

### Do Onya:
1. **Login com Google** = reduz fricção no registro (1 clique vs 4 campos)
2. **Segmentação por persona** = usuário se identifica ("esse app é pra mim")
3. **PWA install prompt** = melhora retenção (acesso por 1 toque)
4. **Tracking duplo** (Meta Pixel + Clarity) = dados para otimizar ads

### Aplicação ao MeuCorre:
- **Entregadores são resistentes a cadastro** → quiz captura sem fricção
- **PRO vitalício R$ 18,90** é nosso diferencial vs concorrentes mensais
- **Programa de indicação R$ 5** é altamente viral neste público (grupos de WhatsApp)
- **Multi-app** é nosso USP — segmentar por persona destaca isso

---

## Conclusão

A combinação de **quiz de captação (ValididaSaaS)** + **segmentação por persona (Onya)** + **referral gamificado** pode reduzir o CAC do MeuCorre de ~R$ 15 para ~R$ 3 em 3 meses, alavancando o público de entregadores que é altamente conectado em grupos de WhatsApp e receptivo a indicações de colegas.

O investimento em quiz + automação de WhatsApp tem ROI rápido porque o ticket médio (R$ 18,90) é baixo mas o volume potencial é alto (2M+ entregadores no Brasil).
