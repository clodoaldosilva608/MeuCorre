# Plano de Implementação Seguro e Incremental — MeuCorre

> **Status:** Planejamento — aguardando aprovação do responsável pelo produto
> **Data:** 12 de agosto de 2026
> **Autor:** Análise técnica sênior (arquitetura, produto, UX, PWA, segurança, CRM B2B, SaaS)
> **Regra absoluta:** Nada que já funciona pode quebrar. Primeiro entender, registrar e proteger; somente depois evoluir incrementalmente.

---

## 1. Resumo Executivo e Princípios Inegociáveis

### 1.1 Resumo

O MeuCorre é um PWA local-first para entregadores controlarem corridas, despesas, quilômetros e lucro líquido. Já possui dashboard premium, quiz de captação, corre do dia com GPS, metas, mapa de calor, onboarding, blog, programa de indicação, painel admin e checkout via Kiwify. A aplicação está em produção em `https://meucorre.vercel.app`.

Este plano descreve a evolução incremental em **9 releases (A–I)**, preservando 100% do que existe, adicionando: Central de Divulgação (450 postagens), Central de Parceiros com CRM B2B, operação outbound supervisionada, campanhas/ofertas, métricas e relatórios. Cada release é reversível, protegida por feature flags e validada por testes.

### 1.2 Princípios inegociáveis

| # | Princípio | Aplicação |
|---|-----------|-----------|
| 1 | Preservar o que funciona | Nenhuma funcionalidade existente pode quebrar, desaparecer ou mudar de comportamento sem justificativa |
| 2 | Local-first | Funções offline continuam offline; sync é opcional e autorizado |
| 3 | Migrations aditivas | Campos novos nullable/default; nunca apagar dados sem plano de retenção |
| 4 | APIs compatíveis | Manter contratos existentes; adicionar endpoints ou versionar |
| 5 | Feature flags | Todo módulo novo protegido por flag; nenhuma flag de envio externo ativa por padrão |
| 6 | Operação supervisionada | O sistema prepara, organiza e pré-visualiza; não envia mensagens, não publica, não paga sem autorização explícita |
| 7 | Privacidade e minimização | Coletar apenas o necessário; opt-out permanente; trilha de auditoria |
| 8 | Commits atômicos | Uma unidade por vez; validar antes de avançar; reversível |
| 9 | Testes antes de deploy | Lint, type-check, build e testes devem passar antes de cada commit |
| 10 | Rollback sempre | Toda release tem plano de desligamento ou reversão sem perda de dados |

---

## 2. Inventário de Fontes Analisadas

### 2.1 Documentos estratégicos e comerciais

| Arquivo | Linhas | Conteúdo | Status |
|---------|--------|----------|--------|
| `upload/Estudo Estratégico do MeuCorre.md` | 927 | 7 oportunidades prioritárias, roadmap 90 dias, arquitetura, métricas, riscos | ✅ Lido |
| `upload/Estratégia de Parceiros e Central CRM do MeuCorre.md` | 691 | CRM completo: segmentos, funil, qualificação, propostas, campanhas, roadmap 4 fases | ✅ Lido |
| `upload/Análise e Aperfeiçoamento da Operação Outbound do MeuCorre.md` | 522 | Adaptação da skill outbound para parceiros B2B, CRUDs, arquitetura, roadmap | ✅ Lido |
| `upload/meucorre_diagnostico_produto.md` | 10 | Diagnóstico base do produto | ✅ Lido |
| `upload/meu-corre_estado_retomada.md` | 17 | Estado do kit comercial (35 ativos, lacuna de 4 artes) | ✅ Lido |

### 2.2 Documentos de divulgação e conteúdo

| Arquivo | Linhas | Conteúdo | Status |
|---------|--------|----------|--------|
| `upload/Prompt para IA de Desenvolvimento — Central de Divulgação do MeuCorre.md` | 559 | Requisitos técnicos: CRUD, calendário, cópia, ICS, lembretes, canais | ✅ Lido |
| `upload/Plano_Divulgacao_MeuCorre_90_Dias.md` | 6089 | Calendário editorial: 90 dias × 5 posts = 450 postagens completas | ✅ Lido |
| `upload/PLANO_DIVULGACAO_90_DIAS_COM_IMAGENS.md` | ~6000 | Plano com vínculo explícito de imagens por postagem | ✅ Lido |
| `upload/MAPA_VISUAL_450_POSTAGENS.md` | 465 | Mapa técnico: 450 imagens organizadas por mês/dia/postagem | ✅ Lido |
| `upload/Pacote Visual do MeuCorre — 90 Dias.md` | 22 | Resumo do pacote visual (450 postagens, 28 ativos base) | ✅ Lido |

### 2.3 Kit comercial e assets visuais

| Arquivo | Conteúdo | Status |
|---------|----------|--------|
| `upload/Kit Comercial Consolidado — MeuCorre.md` | 35 ativos: 5 fotos reais, 5 mascotes, 16 artes vendas, 9 identidade | ✅ Lido |
| `upload/guia_mascotes_extraido.txt` | 5 mascotes descritos (Campeão, Urbano, Carismática, Robô Tech, Courier) | ✅ Lido |
| `upload/manus.im_share_bFmdFxz5y6it3tGjrXCA8W.md` | Origem do kit comercial (Manus) | ✅ Lido |
| `upload/manifest.json` | Manifesto com 35 assets e URLs de download | ✅ Lido |
| `upload/Arquivos adicionais encontrados no fim do painel.md` | Documentos adicionais (Relatório Testes, Auditoria 100k) | ✅ Lido |

### 2.4 Documentos técnicos

| Arquivo | Linhas | Conteúdo | Status |
|---------|--------|----------|--------|
| `upload/github.com_clodoaldosilva608_MeuCorre.md` | 1030 | README completo: arquitetura, schema, APIs, manual, roadmap, segurança | ✅ Lido |
| `upload/SKILL.md` | 151 | Skill Manus: roteamento de deliverables visuais | ✅ Lido |
| `upload/.safety_warning.md` | 71 | Protocolo de segurança para áreas sensíveis | ✅ Lido |

### 2.5 Skill outbound

| Arquivo | Linhas | Conteúdo | Status |
|---------|--------|----------|--------|
| `upload/agencia-outbound-unificada-SKILL.md` | 843 | Skill completa: CRM, Apify, wacli, anti-ban, replies, follow-ups, reporting | ✅ Lido |

### 2.6 Scripts Python

| Arquivo | Conteúdo | Status |
|---------|----------|--------|
| `upload/auditar_ativos_plano_meucorre.py` | Auditoria de ativos do plano | ✅ Lido |
| `upload/extract_meu_corre_assets.py` | Extração de assets do HTML | ✅ Lido |
| `upload/extract_doc_text.py` | Extração de texto de HTML | ✅ Lido |
| `upload/gerar_plano_divulgacao_meucorre.py` | Gerador do plano de 90 dias | ✅ Lido |
| `upload/create_contact_sheet.py` | Gerador da planilha de contato | ✅ Lido |

### 2.7 Código do repositório (analisado in-loco)

| Área | Arquivos chave | Status |
|------|---------------|--------|
| Schema Prisma | `prisma/schema.prisma` (423 linhas, 20+ modelos) | ✅ Analisado |
| API Routes | `src/app/api/` (30+ rotas) | ✅ Analisado |
| Componentes | `src/components/meucorre/` (30+ componentes) | ✅ Analisado |
| Hooks | `src/hooks/` (8 hooks) | ✅ Analisado |
| Lib | `src/lib/` (10+ módulos) | ✅ Analisado |
| Páginas admin | `src/app/admin/` (8 páginas) | ✅ Analisado |
| Páginas app | `src/app/app/` (dashboard) | ✅ Analisado |
| Configuração | `next.config.ts`, `vercel.json`, `package.json` | ✅ Analisado |

### 2.8 Lacunas identificadas

| Lacuna | Impacto | Recomendação |
|--------|---------|--------------|
| 4 artes de vendas ausentes (16 de 20) | Menor — 16 peças suficientes para início | Gerar posteriormente; não bloqueia Release C |
| Relatório de Testes e Usabilidade não disponível | Médio — sem baseline de QA | Criar matriz de teste manual na Release A |
| Auditoria Técnica 100k usuários não disponível | Médio — sem baseline de escala | Validar performance na Release A |
| Imagens das 450 postagens não importadas no projeto | Alto — necessário para Release C | Importar diretório `imagens_por_postagem/` na Release C |
| URLs do manifest.json expiram (Manus CDN) | Alto — assets podem ficar inacessíveis | Baixar e armazenar localmente antes da Release C |

---

## 3. Mapa da Aplicação Atual e Funcionalidades a Preservar

### 3.1 Arquitetura atual

```
MeuCorre (Next.js 16 + TypeScript + Tailwind CSS 4 + shadcn/ui)
├── Landing Page (/)
│   ├── Hero dark com glow neon
│   ├── Quiz de captação (/quiz) → cria conta + trial 14 dias
│   ├── Blog (/blog/*) com 10 posts + carrossel
│   ├── Checkout Kiwify (vitalício R$ 18,90 / mensal R$ 14,90 / anual R$ 97)
│   ├── Capacetes F1 4D no rodapé (YouTube, Instagram, TikTok, Facebook)
│   └── Páginas legais (/termos, /privacidade, /sobre, /faq, /contato)
├── App do Entregador (/app)
│   ├── Dashboard premium (Dark Glassmorphism Tech)
│   ├── Corre do dia (cronômetro + GPS + haversine)
│   ├── Metas diárias/semanais/mensais (barra de progresso)
│   ├── Mapa de calor (Leaflet + OpenStreetMap)
│   ├── Onboarding tutorial (9 passos)
│   ├── Lançamento de corridas (FAB + form + capture por notificação)
│   ├── Lançamento de despesas (6 categorias)
│   ├── Gráficos (Recharts: área, pizza, barras)
│   ├── Sync entre dispositivos (corridas + despesas)
│   ├── Exportação JSON/CSV
│   ├── App Manager (CRUD de apps de entrega com upload de imagem)
│   └── PWA instalável (manifest + service worker)
├── Painel Admin (/admin)
│   ├── Dashboard (receita, vendas, CTR, rating)
│   ├── Anúncios (CRUD: banner_top, card_list, splash)
│   ├── Assinaturas (aprovar/rejeitar, licença crypto)
│   ├── Usuários (CRUD, toggle PRO)
│   ├── Ofertas (CRUD de produtos parceiros)
│   ├── Blog (CRUD + publicar no Blogger via OAuth2)
│   ├── Feedbacks (lista, filtros por nota)
│   ├── Indicações (CRUD, campanha, PIX)
│   └── Login admin (email + senha, cookie httpOnly)
├── APIs (/api)
│   ├── Auth (register, login, logout, me, forgot/reset password, update-profile)
│   ├── Sync (GET pull + POST push, cursor composto, rate limit)
│   ├── Ads (GET público + click tracking)
│   ├── Offers (GET público + click tracking)
│   ├── Blog (GET público)
│   ├── Quiz (POST submit + POST convert)
│   ├── License (verify + by-order)
│   ├── Subscription (CRUD + receipt upload)
│   ├── Feedback (POST)
│   ├── Referral (code, register, stats, pix)
│   ├── Lifetime status
│   ├── Blogger callback (OAuth2 token exchange)
│   ├── Kiwify webhook (auto-aprovação)
│   ├── Health check
│   ├── Cron (purge ad-events)
│   └── Admin (login, logout, dashboard, ads, subscriptions, users, offers, blog, feedback, settings, referrals)
└── Banco de Dados
    ├── PostgreSQL (Supabase) — servidor
    │   ├── Ad, AdEvent, Feedback
    │   ├── Subscription, User, PasswordResetToken
    │   ├── Offer, BlogPost, Setting
    │   ├── AdminUser, AdminAction
    │   ├── ReferralCode, Referral, ReferralCampaign
    │   ├── SyncedDelivery, SyncedExpense
    │   ├── SyncedGoal, SyncedWorkSession
    │   └── Lead (quiz)
    └── IndexedDB (Dexie v6) — cliente
        ├── deliveries, expenses, apps
        ├── goals, workSessions
        └── (isolado por usuário)
```

### 3.2 Funcionalidades que DEVEM ser preservadas

| Área | Arquivos chave | Risco de regressão |
|------|---------------|-------------------|
| Registro de corridas | `src/hooks/use-deliveries.ts`, `src/lib/db.ts`, `src/components/meucorre/delivery-form.tsx` | Alto — núcleo do produto |
| Registro de despesas | `src/hooks/use-deliveries.ts`, `src/components/meucorre/expense-form.tsx` | Alto |
| Cálculo de lucro líquido | `src/hooks/use-deliveries.ts` (`computeStats`) | Crítico — não alterar fórmula |
| Dashboard e gráficos | `src/components/meucorre/summary-cards.tsx`, `charts.tsx` | Médio |
| Corre do dia (GPS) | `src/hooks/use-work-sessions.ts`, `src/components/meucorre/corre-do-dia.tsx` | Médio |
| Metas | `src/hooks/use-goals.ts`, `src/components/meucorre/goals-progress.tsx` | Médio |
| Mapa de calor | `src/hooks/use-heatmap.ts`, `src/components/meucorre/heatmap-map.tsx` | Médio |
| Onboarding | `src/components/meucorre/onboarding-popup.tsx` | Baixo |
| Local-first/offline | `src/lib/db.ts` (Dexie v6), `public/sw.js`, `public/manifest.json` | Crítico |
| PWA e instalação | `public/manifest.json`, `public/sw.js`, `src/components/meucorre/install-app-popup.tsx` | Alto |
| Auth (user) | `src/app/api/auth/*`, `src/lib/user-auth.ts` | Crítico |
| Auth (admin) | `src/app/api/admin/login/`, `src/lib/admin-auth.ts` | Crítico |
| Trial e PRO | `src/hooks/use-trial.ts`, `src/app/api/license/*` | Crítico |
| Checkout Kiwify | `src/app/page.tsx` (CheckoutDialog), `src/app/api/webhooks/kiwify/` | Crítico |
| Indicação | `src/app/api/referral/*`, `src/app/api/admin/referrals/*` | Alto |
| Painel admin (todas abas) | `src/app/admin/*` | Alto |
| Blog | `src/app/blog/*`, `src/app/api/blog/`, `src/app/api/admin/blog/` | Médio |
| Blogger OAuth2 | `src/app/api/blogger-callback/`, `src/app/api/admin/blog/publish-blogger/` | Médio |
| Quiz | `src/app/quiz/`, `src/app/api/quiz/*` | Médio |
| Sync | `src/app/api/sync/`, `src/hooks/use-sync.ts` | Alto |
| Exportação | `src/hooks/use-deliveries.ts` (exportJSON, exportCSV) | Baixo |
| Landing page | `src/app/page.tsx` | Médio |
| Identidade visual | `src/app/globals.css`, `public/*` | Médio |

---

## 4. Matriz de Requisitos Rastreável

### 4.1 Requisitos extraídos dos documentos

| ID | Origem documental | Requisito | Tipo | Impacto | Arquivos/entidades afetados | Dependências | Risco | Prioridade | Critério de aceite | Rollback |
|----|-------------------|-----------|------|--------|----------------------------|--------------|-------|------------|-------------------|----------|
| R001 | Prompt Central Divulgação | Nova aba `/admin/divulgacao` no painel admin | Planejado | Baixo — aditivo | `src/app/admin/divulgacao/page.tsx` (novo), `src/app/admin/layout.tsx` (adicionar item menu) | Nenhuma | Baixo | Alta | Aba aparece no menu, rota protegida por auth admin | Remover item de menu + rota |
| R002 | Prompt Central Divulgação | CRUD de Campaigns (nome, objetivo, período, status, cor, UTM) | Planejado | Baixo — tabela nova | `prisma/schema.prisma` (model Campaign), nova API | Migration aditiva | Baixo | Alta | CRUD funciona, migration aplicada sem erro | Drop table + remover rota |
| R003 | Prompt Central Divulgação | CRUD de PromotionPost (450 postagens com todos os campos) | Planejado | Baixo — tabela nova | `prisma/schema.prisma` (model PromotionPost), nova API | R002 | Baixo | Alta | CRUD funciona, 450 posts importáveis | Drop table + remover rota |
| R004 | Prompt Central Divulgação | Importação do calendário de 90 dias (450 postagens) | Planejado | Médio — dados em lote | Script de importação, API de import | R003, assets disponíveis | Médio — dados ausentes | Alta | 450 posts importados sem duplicação, ordem preservada | Delete dos posts importados |
| R005 | Prompt Central Divulgação | Biblioteca de assets (PromotionAsset) | Planejado | Baixo — tabela nova | `prisma/schema.prisma` (model PromotionAsset), API | Nenhuma | Baixo | Alta | Upload, tags, busca funcionam | Drop table |
| R006 | Prompt Central Divulgação | Botões de cópia (título, descrição, hashtags, CTA, completo) | Planejado | Baixo — frontend | `src/app/admin/divulgacao/` (componentes) | R003 | Baixo | Alta | Cada botão copia campo correto, mostra confirmação | Remover componentes |
| R007 | Prompt Central Divulgação | Download da imagem correta por postagem | Planejado | Baixo — frontend | `src/app/admin/divulgacao/` | R005 | Baixo | Alta | Imagem correta baixada com nome legível | Remover função |
| R008 | Prompt Central Divulgação | Exportação ICS (1 post, dia, semana, 90 dias) | Planejado | Baixo — frontend | `src/app/admin/divulgacao/` | R003 | Baixo | Média | ICS com fuso correto, título, plataforma, horário | Remover função |
| R009 | Prompt Central Divulgação | Painel de canais oficiais (SocialChannel CRUD) | Planejado | Baixo — tabela nova | `prisma/schema.prisma` (model SocialChannel), API | Nenhuma | Baixo | Média | CRUD funciona, links copiáveis | Drop table |
| R010 | Prompt Central Divulgação | Lembretes via notificação do navegador (opcional) + fallback ICS | Planejado | Baixo — frontend | `src/app/admin/divulgacao/` | R003 | Baixo — limitações PWA | Baixa | Permissão solicitada, lembrete funciona quando browser aberto | Remover função |
| R011 | Estratégia CRM Parceiros | Nova aba `/admin/parceiros` no painel admin | Planejado | Baixo — aditivo | `src/app/admin/parceiros/page.tsx` (novo) | Nenhuma | Baixo | Alta | Aba aparece no menu, rota protegida | Remover item de menu + rota |
| R012 | Estratégia CRM Parceiros | CRUD de empresas (Partner) | Planejado | Baixo — tabela nova | `prisma/schema.prisma` (model Partner), API | Migration aditiva | Baixo | Alta | CRUD funciona, busca, filtros, tags | Drop table |
| R013 | Estratégia CRM Parceiros | CRUD de contatos (PartnerContact) | Planejado | Baixo — tabela nova | `prisma/schema.prisma` (model PartnerContact), API | R012 | Baixo | Alta | CRUD funciona, opt-out, decisor | Drop table |
| R014 | Estratégia CRM Parceiros | CRUD de oportunidades (Opportunity) com pipeline Kanban | Planejado | Médio — UI complexa | `prisma/schema.prisma` (model Opportunity), API, componente Kanban | R012, R013 | Médio — drag & drop | Alta | CRUD funciona, estágios, valor, probabilidade | Drop table |
| R015 | Estratégia CRM Parceiros | CRUD de atividades/tarefas (PartnerActivity) | Planejado | Baixo — tabela nova | `prisma/schema.prisma` (model PartnerActivity), API | R012 | Baixo | Alta | CRUD funciona, tipos, prazos, lembretes | Drop table |
| R016 | Estratégia CRM Parceiros | Importação CSV de leads com prévia e deduplicação | Planejado | Médio — parsing | API de import, frontend de preview | R012 | Médio — dados inválidos | Média | CSV importado, duplicatas detectadas, preview aprovado | Delete dos importados |
| R017 | Estratégia CRM Parceiros | Dashboard comercial (pipeline, tarefas, receita, alertas) | Planejado | Baixo — frontend | `src/app/admin/parceiros/dashboard` | R012-R015 | Baixo | Média | Dashboard mostra métricas em tempo real | Remover componentes |
| R018 | Estratégia CRM Parceiros | Gerador de propostas com templates | Planejado | Médio — templates | `prisma/schema.prisma` (model Proposal), API, editor | R014 | Médio | Média | Template selecionável, campos preenchidos, versão, validade | Drop table |
| R019 | Estratégia CRM Parceiros | Biblioteca de materiais (media kit, cases, contratos) | Planejado | Baixo — tabela nova | `prisma/schema.prisma` (model CommercialAsset), API | Nenhuma | Baixo | Média | Upload, tags, versionamento, link | Drop table |
| R020 | Estratégia CRM Parceiros | CRUD de campanhas/ofertas (Campaign com offer, CTA, cupom) | Planejado | Médio — integração com anúncios existentes | `prisma/schema.prisma` (model PartnerCampaign), API | R014 | Médio — não quebrar anúncios atuais | Alta | Campanha criada, aprovada, publicada sem afetar anúncios existentes | Drop table |
| R021 | Análise Outbound | Templates de mensagem versionados (OutboundTemplate) | Planejado | Baixo — tabela nova | `prisma/schema.prisma` (model OutboundTemplate), API | R013 | Baixo | Média | Template com variáveis, versão, status | Drop table |
| R022 | Análise Outbound | Preview e aprovação de mensagens (dry-run) | Planejado | Baixo — frontend | `src/app/admin/parceiros/outbound/` | R021 | Baixo | Alta | Preview mostra empresa, contato, mensagem; aprovação registra | Remover função |
| R023 | Análise Outbound | Registro de envio e resposta (OutboundLog) | Planejado | Baixo — tabela nova | `prisma/schema.prisma` (model OutboundLog), API | R021 | Baixo | Alta | Status: preparado, enviado, respondeu, opt-out, etc. | Drop table |
| R024 | Análise Outbound | Classificação de respostas (IA ou manual) | Planejado | Médio — IA | API de classificação, `z-ai-web-dev-sdk` | R023 | Médio — precisão | Baixa | Resposta classificada: permission, interested, opt_out, meeting, etc. | Remover automação |
| R025 | Análise Outbound | Opt-out permanente | Planejado | Baixo — campo | `PartnerContact.optOut` | R013 | Baixo | Alta | Contato com opt-out nunca é selecionado para envio | Reverter campo |
| R026 | Estratégia CRM | Relatórios comerciais (funil, receita, conversão, renovação) | Planejado | Baixo — frontend | `src/app/admin/parceiros/relatorios/` | R012-R020 | Baixo | Média | Filtros por período, categoria, cidade, responsável | Remover página |
| R027 | Estratégia CRM | Auditoria (PartnerLog) | Planejado | Baixo — tabela nova | `prisma/schema.prisma` (model PartnerLog) | R012 | Baixo | Alta | Toda alteração registrada com usuário, data, valor anterior | Drop table |
| R028 | Estratégia CRM | Permissões (admin master, gestor, executivo, operação, financeiro, leitura) | Planejado | Médio — segurança | `AdminUser.role` (já existe), middleware | Nenhuma | Médio — ampliar acesso | Média | Papéis respeitam permissões; não ampliam acesso existente | Reverter papéis |
| R029 | Estudo Estratégico | Fechamento diário inteligente (card no dashboard) | Planejado | Baixo — frontend | `src/app/app/page.tsx`, novo componente | Dados existentes | Baixo | Média | Card aparece no fim do turno, mostra resumo | Remover componente |
| R030 | Estudo Estratégico | Onboarding orientado a valor (melhorar existente) | Planejado | Baixo — frontend | `src/components/meucorre/onboarding-popup.tsx` | Nenhum | Baixo — mudar UX existente | Média | Onboarding guia primeira corrida + despesa | Reverter para versão atual |
| R031 | Estudo Estratégico | Desafio de 7 dias | Planejado | Médio — novo módulo | Novo hook, componente, state | Nenhum | Médio | Baixa | 7 tarefas diárias, resumo no final | Remover módulo |
| R032 | Estudo Estratégico | Radar do Prejuízo (alertas explicáveis) | Planejado | Médio — regras | Novo hook, componente | Dados existentes | Médio — falsos positivos | Baixa | Alertas baseados em médias móveis, explicáveis, desligáveis | Remover módulo |
| R033 | Estudo Estratégico | MeuCorre Score (consistência) | Planejado | Médio — cálculo | Novo hook, componente | R032 | Médio | Baixa | Score mostra faixas de evolução, próximos passos | Remover módulo |
| R034 | Estudo Estratégico | Escada de planos (mensal/anual/vitalício) | Existente | — | Já implementado (mensal R$14,90, anual R$97, vitalício R$18,90) | Nenhum | — | — | — | — |
| R035 | Estudo Estratégico | Central de Indicações expandida | Existente + Planejado | Médio — evoluir existente | `src/app/api/referral/*`, `src/app/app/page.tsx` | Nenhum | Médio — não quebrar indicação atual | Baixa | Badges, leaderboard, página pública de status | Reverter para versão atual |
| R036 | Estudo Estratégico | MeuCorre Equipes (B2B) | Planejado | Alto — novo módulo | Novos modelos, APIs, componentes | R012-R020 validados | Alto — privacidade | Baixa | MVP: organização, convites, painel agregado | Feature flag off |
| R037 | Prompt Divulgação | Pré-visualização por plataforma (Instagram, TikTok, Facebook, YouTube) | Planejado | Baixo — frontend | `src/app/admin/divulgacao/` | R003 | Baixo | Baixa | Preview adapta formato por plataforma | Remover componente |
| R038 | Estratégia CRM | Calendar view (mês, semana, dia, lista) | Planejado | Médio — UI | `src/app/admin/divulgacao/calendar` | R003 | Médio | Média | Calendário mostra posts por data, cor por plataforma | Remover componente |
| R039 | Estratégia CRM | Automações supervisionadas (lembretes, follow-ups) | Planejado | Médio — jobs | API de jobs, cron | R015, R023 | Médio — timing | Baixa | Lembretes criados, sem disparo automático externo | Desabilitar jobs |
| R040 | Prompt Divulgação | PromoçãoPost com PromotionReminder | Planejado | Baixo — tabela nova | `prisma/schema.prisma` (model PromotionReminder) | R003 | Baixo | Baixa | Lembrete criado, status, fallback ICS | Drop table |

---

## 5. Arquitetura Atual e Arquitetura Alvo Incremental

### 5.1 Arquitetura atual (preservada)

| Camada | Tecnologia | Arquivo de referência |
|--------|-----------|----------------------|
| Framework | Next.js 16 (App Router, Turbopack) | `package.json` |
| Linguagem | TypeScript 5 | `tsconfig.json` |
| UI | Tailwind CSS 4 + shadcn/ui + Lucide icons | `tailwind.config.ts`, `components.json` |
| Animações | Framer Motion 12 | `package.json` |
| Banco local (app) | Dexie.js 4 (IndexedDB v6) | `src/lib/db.ts` |
| Banco servidor (admin) | PostgreSQL (Supabase) via Prisma 6 | `prisma/schema.prisma` |
| Gráficos | Recharts 2 | `src/components/meucorre/charts.tsx` |
| Mapas | Leaflet + leaflet.heat | `src/components/meucorre/heatmap-map.tsx` |
| Pagamentos | Kiwify (webhook + redirect) | `src/app/api/webhooks/kiwify/` |
| Auth admin | Cookie httpOnly + JWT (jose) | `src/lib/admin-auth.ts` |
| Auth user | Cookie httpOnly + JWT (jose) | `src/lib/user-auth.ts` |
| Rate limit | Upstash Redis | `src/lib/rate-limit.ts` |
| Observabilidade | Sentry | `sentry.*.config.ts` |
| PWA | manifest.json + sw.js | `public/` |
| Deploy | Vercel | `vercel.json` |
| Blog externo | Blogger API v3 (googleapis) | `src/app/api/admin/blog/publish-blogger/` |

### 5.2 Arquitetura alvo incremental

```
Admin MeuCorre
├── Funcionalidades atuais preservadas (NÃO TOCAR)
│   ├── Dashboard, Anúncios, Assinaturas, Usuários
│   ├── Ofertas, Blog, Feedbacks, Indicações
│   └── Login, Logout, Settings
├── Central de Divulgação (NOVO — Release C)
│   ├── /admin/divulgacao (página principal)
│   ├── Calendário de 90 dias (mês/semana/dia/lista)
│   ├── CRUD de Campaigns + PromotionPosts
│   ├── Biblioteca de assets (PromotionAsset)
│   ├── Botões de cópia (título, descrição, hashtags, CTA, completo)
│   ├── Download da imagem correta
│   ├── Status de publicação (rascunho → revisada → publicada)
│   ├── Exportação ICS (1 post, dia, semana, 90 dias)
│   ├── Lembretes (notificação browser + fallback ICS)
│   ├── Pré-visualização por plataforma
│   ├── Painel de canais oficiais (SocialChannel CRUD)
│   └── Feature flag: admin_marketing_hub_enabled
├── Central de Parceiros / CRM (NOVO — Releases D-F)
│   ├── /admin/parceiros (página principal)
│   ├── Dashboard comercial (pipeline, tarefas, receita, alertas)
│   ├── CRUD de empresas (Partner)
│   ├── CRUD de contatos (PartnerContact, com opt-out)
│   ├── CRUD de leads (importação CSV, deduplicação)
│   ├── Pipeline Kanban (Opportunity, estágios configuráveis)
│   ├── Atividades e tarefas (PartnerActivity)
│   ├── Propostas (Proposal, templates, versões, validade)
│   ├── Biblioteca de materiais (CommercialAsset)
│   ├── Campanhas e ofertas (PartnerCampaign)
│   ├── Relatórios (funil, receita, conversão, renovação)
│   ├── Auditoria (PartnerLog)
│   ├── Permissões (roles: master, gestor, executivo, operação, financeiro)
│   └── Feature flags: admin_partner_crm_enabled, partner_campaigns_enabled
├── Operação Outbound Supervisionada (NOVO — Release G)
│   ├── Templates de mensagem (OutboundTemplate, versionados)
│   ├── Preview e aprovação (dry-run)
│   ├── Registro de envio (OutboundLog)
│   ├── Classificação de respostas (IA ou manual)
│   ├── Opt-out permanente
│   ├── Follow-ups e cadência
│   ├── NENHUM envio automático sem autorização explícita
│   └── Feature flags: partner_outbound_preview_enabled, partner_outbound_send_enabled (OFF por padrão)
├── Métricas e Relatórios (NOVO — Release H)
│   ├── Dashboard executivo
│   ├── Relatórios exportáveis (CSV/PDF)
│   ├── Alertas e notificações
│   ├── Saúde de campanhas
│   └── Renovação
└── Fundamentos Transversais (NOVO — Release B)
    ├── Feature flags (tabela Setting ou env vars)
    ├── Autorização e logs (AdminAction já existe)
    ├── Privacidade e minimização de dados
    ├── Testes e observabilidade
    └── Migrations compatíveis (forward-only)
```

### 5.3 Justificativa da arquitetura

- **Por que adicionar, não modificar:** O painel admin atual funciona e tem usuários. Adicionar novas abas e rotas não afeta as existentes.
- **Por que Prisma (não outro ORM):** O projeto já usa Prisma 6. Novos modelos seguem o mesmo padrão.
- **Por que feature flags:** Permite liberar gradualmente, testar internamente e desligar sem deploy.
- **Por que tabelas separadas para CRM vs anúncios:** Anúncios atuais (Ad) são operacionais; CRM é comercial. Não misturar.
- **Por que não usar Apify/wacli diretamente:** A análise outbound recomenda supervisão humana. O sistema prepara; o administrador executa manualmente ou autoriza.

---

## 6. Mapa de Dependências, Dados, Permissões e Integrações

### 6.1 Dependências entre releases

```
Release A (Baseline)
    └── Release B (Fundação: feature flags, navegação)
         ├── Release C (Central de Divulgação)
         │    └── Release C2 (CRUD completo + ICS + lembretes)
         └── Release D (CRM básico: empresas, contatos, leads, pipeline)
              ├── Release E (Propostas e materiais)
              │    └── Release F (Campanhas e ofertas)
              │         └── Release G (Outbound supervisionado)
              │              └── Release H (Métricas e relatórios)
              └── Release I (Recursos avançados: portal parceiro, equipes)
```

### 6.2 Novos modelos Prisma (todos aditivos)

| Modelo | Release | Campos chave | Relações |
|--------|---------|-------------|----------|
| Campaign | C | name, objective, startAt, endAt, status, color, defaultUtm | → PromotionPost[] |
| PromotionPost | C | campaignId, editorialDay, sequenceNumber, publishAt, platform, format, pillar, title, description, hashtags, engagementText, cta, destinationUrl, altText, videoScript, status, publishedAt, utmQuery, assetId | → Campaign, → PromotionAsset |
| PromotionAsset | C | name, storageKey, publicUrl, mimeType, width, height, fileSize, altText, source, baseAssetName, tags, hash | → PromotionPost[] |
| SocialChannel | C | name, platform, profileUrl, bannerUrl, promoTitle, promoText, active, sortOrder | — |
| PromotionReminder | C | postId, remindAt, minutesBefore, channel, status, sentAt | → PromotionPost |
| Partner | D | companyName, tradeName, cnpj, category, city, state, website, logoUrl, description, status, assignedTo | → PartnerContact[], → Opportunity[], → PartnerCampaign[] |
| PartnerContact | D | partnerId, name, role, email, phone, linkedin, isPrimary, optOut | → Partner |
| Opportunity | D | partnerId, title, stage, value, model, notes, expectedCloseDate, closedAt, closedReason | → Partner |
| PartnerActivity | D | partnerId, type, description, scheduledAt, completedAt, assignedTo | → Partner |
| PartnerLog | D | partnerId, action, details, adminId, adminEmail, ipAddress | → Partner |
| Proposal | E | opportunityId, templateId, version, status, validUntil, content, sentAt, acceptedAt | → Opportunity |
| CommercialAsset | E | type, name, fileUrl, tags, version, language | — |
| PartnerCampaign | F | partnerId, opportunityId, title, offerType, offerValue, couponCode, ctaText, ctaUrl, startsAt, endsAt, status, clicks, redemptions | → Partner, → Opportunity |
| OutboundTemplate | G | name, channel, segment, objective, body, variables, cta, optOutText, status, version | — |
| OutboundLog | G | partnerId, contactId, templateId, channel, status, messageBody, sentAt, responseText, responseClass, responseAt | → Partner, → PartnerContact |

### 6.3 Permissões

| Papel | Release | Acessos |
|-------|---------|---------|
| admin (existente) | Atual | Tudo que existe hoje |
| super_admin (existente) | Atual | Tudo + configurações |
| gestor_comercial | D+ | CRM: empresas, contatos, oportunidades, propostas, campanhas, relatórios |
| executivo_comercial | D+ | CRM: leads e oportunidades atribuídas, atividades |
| operacao_campanha | F+ | Campanhas: ativação, assets, revisão, métricas (sem contratos) |
| financeiro | H+ | Cobrança, valores, recebimentos, relatórios financeiros |
| leitura | D+ | Consulta, sem editar ou exportar |

### 6.4 Integrações existentes (preservar)

| Integração | Arquivo | Risco |
|-----------|---------|-------|
| Kiwify (checkout + webhook) | `src/app/api/webhooks/kiwify/` | Não tocar |
| Blogger OAuth2 | `src/app/api/blogger-callback/`, `src/app/api/admin/blog/publish-blogger/` | Não tocar |
| Supabase (Postgres) | `prisma/schema.prisma` | Adicionar tabelas, não modificar existentes |
| Upstash Redis (rate limit) | `src/lib/rate-limit.ts` | Não tocar |
| Sentry (observabilidade) | `sentry.*.config.ts` | Não tocar |
| Resend (email) | Configurado via env vars | Não tocar |

### 6.5 Integrações novas (planejadas)

| Integração | Release | Risco | Pré-requisito |
|-----------|---------|-------|---------------|
| z-ai-web-dev-sdk (classificação de respostas) | G | Baixo — server-side only | R024 |
| Clipboard API (cópia de posts) | C | Baixo — frontend | R006 |
| Notification API (lembretes) | C | Baixo — frontend, limitações PWA | R010 |
| ICS export (calendário) | C | Baixo — geração de arquivo | R008 |

---

## 7. Estratégia de Compatibilidade, Migrations, Feature Flags e Rollback

### 7.1 Política de mudança segura

| Área | Estratégia |
|------|-----------|
| Banco de dados | Migrations aditivas; campos novos nullable/default; backfill controlado; nunca apagar dados sem plano de retenção e backup |
| APIs | Manter contratos existentes; adicionar endpoints ou versionar; não mudar payload existente silenciosamente |
| Interface | Adicionar itens de navegação sem remover telas atuais; reutilizar design system; proteger módulos novos por feature flag |
| Permissões | Criar papéis e permissões novas sem ampliar acesso existente por acidente |
| PWA/offline | Não substituir cache ou armazenamento local sem teste de atualização, migração e reversão |
| Pagamentos | Isolar mudanças de plano/checkout; validar webhooks; não tocar em transações antigas |
| Assets | Não mover, renomear ou apagar imagens existentes sem aliases, manifest ou migração de referências |
| Jobs e integrações | Idempotência, filas, retry controlado, logs e desligamento seguro |
| Produção | Canary interno, observabilidade e rollout gradual |

### 7.2 Feature flags

| Flag | Release | Propósito | Padrão | Público | Critério de remoção |
|------|---------|-----------|--------|---------|---------------------|
| `admin_marketing_hub_enabled` | C | Habilitar Central de Divulgação | OFF | Admin master | Após validação completa do módulo |
| `admin_partner_crm_enabled` | D | Habilitar Central de Parceiros | OFF | Admin master | Após validação completa do CRM |
| `partner_campaigns_enabled` | F | Habilitar campanhas de parceiros | OFF | Admin master + gestor | Após primeiro parceiro ativo validado |
| `partner_outbound_preview_enabled` | G | Habilitar preview de mensagens outbound | OFF | Admin master + gestor | Após validação do preview |
| `partner_outbound_send_enabled` | G | Habilitar registro de envio (NÃO envio automático) | OFF | Admin master apenas | Após validação manual de 10 envios |
| `partner_portal_enabled` | I | Habilitar portal do parceiro | OFF | Admin master | Após validação com parceiro piloto |

**Implementação:** Usar tabela `Setting` existente (key-value) ou env vars. Flags verificadas no layout admin (`src/app/admin/layout.tsx`) para mostrar/ocultar itens de menu.

### 7.3 Estratégia de rollback

| Release | Como reverter |
|---------|--------------|
| A | N/A — somente testes e documentação |
| B | Desligar feature flags (Setting key = "false") |
| C | Feature flag off + drop tabelas Campaign, PromotionPost, PromotionAsset, SocialChannel, PromotionReminder |
| D | Feature flag off + drop tabelas Partner, PartnerContact, Opportunity, PartnerActivity, PartnerLog |
| E | Drop tabelas Proposal, CommercialAsset |
| F | Drop tabela PartnerCampaign |
| G | Drop tabelas OutboundTemplate, OutboundLog + feature flag off |
| H | Remover páginas de relatórios |
| I | Feature flag off |

**Nenhuma tabela existente é modificada ou removida em nenhuma release.**

---

## 8. Releases Detalhadas

### Release A — Baseline e Proteção

| Campo | Valor |
|-------|-------|
| **Objetivo** | Estabelecer baseline de testes, inventário completo e proteção contra regressões |
| **Escopo incluído** | Matriz de teste manual de baseline; documentação de rotas/APIs existentes; verificação de build/lint/typecheck; snapshot do schema Prisma |
| **Escopo excluído** | Qualquer nova funcionalidade; qualquer alteração de código existente |
| **Dependências** | Nenhuma |
| **Alterações técnicas** | Criar `docs/IMPLEMENTATION_LOG.md`; criar `docs/BASELINE_QA.md` com matriz de teste manual |
| **Compatibilidade** | 100% — nada muda no produto |
| **Feature flag** | Nenhuma |
| **Dados/migration** | Nenhum |
| **Testes** | Executar `npx tsc --noEmit`, `npx eslint src/ --max-warnings 0`, `npm run build`; matriz de teste manual cobrindo: login, registro, corridas, despesas, gráficos, metas, corre do dia, mapa de calor, onboarding, quiz, blog, admin (todas abas), checkout, indicação |
| **Critérios de aceite** | Build passa; lint passa; typecheck passa; matriz de teste manual documentada com resultados |
| **Monitoramento** | N/A |
| **Rollback** | N/A — somente documentação |
| **Riscos** | Baixo — nenhuma alteração de código |
| **Estimativa** | 1-2 dias |

### Release B — Fundação Administrativa

| Campo | Valor |
|-------|-------|
| **Objetivo** | Criar estrutura de navegação e feature flags sem mudar fluxos existentes |
| **Escopo incluído** | Feature flags via Setting; adicionar itens de menu "Divulgação" e "Parceiros" no layout admin (ocultos por flag); criar rotas vazias protegidas |
| **Escopo excluído** | Qualquer CRUD, qualquer dados, qualquer UI além de placeholder |
| **Dependências** | Release A |
| **Alterações técnicas** | `src/app/admin/layout.tsx` (adicionar itens de menu condicionais); `src/app/admin/divulgacao/page.tsx` (placeholder); `src/app/admin/parceiros/page.tsx` (placeholder); seeds de feature flags na tabela Setting |
| **Compatibilidade** | Itens de menu só aparecem quando flag = "true"; flags começam como "false" |
| **Feature flag** | `admin_marketing_hub_enabled` = false; `admin_partner_crm_enabled` = false |
| **Dados/migration** | Insert Setting rows (aditivo, nullable) |
| **Testes** | Lint, typecheck, build; verificar que menu não mostra novos itens por padrão; verificar que rotas retornam 401 sem auth |
| **Critérios de aceite** | Build passa; admin sem novas abas visíveis; rotas protegidas; flags na tabela Setting |
| **Rollback** | Remover itens de menu + rotas; delete Setting rows |
| **Riscos** | Baixo — somente adição |
| **Estimativa** | 1 dia |

### Release C — Central de Divulgação

| Campo | Valor |
|-------|-------|
| **Objetivo** | Implementar Central de Divulgação completa com 450 postagens, assets, cópia, download, ICS e lembretes |
| **Escopo incluído** | Modelos Prisma (Campaign, PromotionPost, PromotionAsset, SocialChannel, PromotionReminder); APIs CRUD; importação do calendário de 90 dias; biblioteca de assets; botões de cópia; download de imagem; exportação ICS; lembretes (Notification API + fallback); pré-visualização por plataforma; painel de canais; calendário visual (mês/semana/dia/lista) |
| **Escopo excluído** | Publicação automática em redes sociais; integração com APIs externas de redes sociais |
| **Dependências** | Release B; assets visuais disponíveis (baixar de URLs do manifest.json) |
| **Alterações técnicas** | 5 novos modelos Prisma; ~15 novos endpoints API; página `/admin/divulgacao` com subpáginas; script de importação das 450 postagens; importação de assets |
| **Compatibilidade** | Nova aba no admin; não afeta nada existente |
| **Feature flag** | `admin_marketing_hub_enabled` = true (após validação interna) |
| **Dados/migration** | `prisma db push` — 5 tabelas novas aditivas; importação de 450 posts via script |
| **Testes** | Lint, typecheck, build; importação sem duplicação; cópia de cada campo; download correto; ICS com fuso correto; filtros por plataforma/mês/status; CRUD completo; mobile |
| **Critérios de aceite** | 450 posts importados sem duplicação; cada post tem título, descrição, hashtags, CTA, imagem; botões de cópia funcionam; ICS exportável; calendário visual funciona; mobile responsivo |
| **Rollback** | Feature flag off + drop 5 tabelas |
| **Riscos** | Médio — dados ausentes (4 artes); URLs do manifest expiram |
| **Estimativa** | 5-7 dias |

### Release D — CRM Básico

| Campo | Valor |
|-------|-------|
| **Objetivo** | Implementar CRM de parceiros com empresas, contatos, leads, pipeline, atividades e auditoria |
| **Escopo incluído** | Modelos Prisma (Partner, PartnerContact, Opportunity, PartnerActivity, PartnerLog); APIs CRUD; página `/admin/parceiros` com dashboard, lista, ficha 360°, pipeline Kanban; importação CSV com preview e deduplicação; busca, filtros, tags; permissões |
| **Escopo excluído** | Propostas, materiais, campanhas, outbound |
| **Dependências** | Release B |
| **Alterações técnicas** | 5 novos modelos Prisma; ~12 novos endpoints API; página `/admin/parceiros` com subpáginas; componente Kanban |
| **Compatibilidade** | Nova aba no admin; não afeta nada existente |
| **Feature flag** | `admin_partner_crm_enabled` = true (após validação interna) |
| **Dados/migration** | `prisma db push` — 5 tabelas novas aditivas |
| **Testes** | Lint, typecheck, build; CRUD completo; deduplicação; busca; filtros; Kanban drag&drop; permissões; auditoria; mobile |
| **Critérios de aceite** | CRUD de empresas/contatos/leads funciona; pipeline mostra estágios; atividades registradas; auditoria registra alterações; importação CSV com preview; mobile responsivo |
| **Rollback** | Feature flag off + drop 5 tabelas |
| **Riscos** | Médio — UI Kanban complexa |
| **Estimativa** | 5-7 dias |

### Release E — Propostas e Materiais

| Campo | Valor |
|-------|-------|
| **Objetivo** | Adicionar gerador de propostas e biblioteca de materiais comerciais |
| **Escopo incluído** | Modelos Prisma (Proposal, CommercialAsset); APIs CRUD; templates de proposta; versões; validade; links; aprovação humana; biblioteca de materiais (media kit, cases, contratos) |
| **Escopo excluído** | Assinatura digital; integração com DocuSign |
| **Dependências** | Release D |
| **Alterações técnicas** | 2 novos modelos Prisma; ~6 novos endpoints API; página de propostas e biblioteca |
| **Compatibilidade** | Adição ao CRM existente |
| **Feature flag** | `admin_partner_crm_enabled` (já ativa) |
| **Dados/migration** | 2 tabelas novas aditivas |
| **Testes** | CRUD; templates; versões; validade; aprovação; links |
| **Critérios de aceite** | Proposta criada de template; versões preservadas; validade funciona; aprovação registra usuário e data |
| **Rollback** | Drop 2 tabelas |
| **Riscos** | Baixo |
| **Estimativa** | 3-4 dias |

### Release F — Campanhas e Ofertas

| Campo | Valor |
|-------|-------|
| **Objetivo** | Conectar venda comercial à operação do aplicativo com campanhas, ofertas e benefícios |
| **Escopo incluído** | Modelo Prisma (PartnerCampaign); API CRUD; campanhas com oferta, cupom, CTA, assets, vigência, região; aprovação e publicação; métricas (cliques, resgates); integração com anúncios existentes (não substituir); denúncia e pausa |
| **Escopo excluído** | Portal do parceiro; automação de publicação |
| **Dependências** | Release D + E |
| **Alterações técnicas** | 1 novo modelo Prisma; ~4 novos endpoints API; página de campanhas; integração com Offer/Ad existentes |
| **Compatibilidade** | Anúncios atuais (Ad) NÃO são modificados; PartnerCampaign é uma camada adicional |
| **Feature flag** | `partner_campaigns_enabled` = true (após validação) |
| **Dados/migration** | 1 tabela nova aditiva |
| **Testes** | CRUD; aprovação; vigência; pausa; métricas; denúncia; anúncios existentes continuam funcionando |
| **Critérios de aceite** | Campanha criada, aprovada, publicada sem afetar anúncios atuais; métricas registradas; pausa funciona |
| **Rollback** | Feature flag off + drop tabela |
| **Riscos** | Médio — não quebrar anúncios existentes |
| **Estimativa** | 3-4 dias |

### Release G — Outbound Supervisionado

| Campo | Valor |
|-------|-------|
| **Objetivo** | Adicionar módulo de prospecção B2B supervisionada (preview, aprovação, registro, respostas, opt-out) |
| **Escopo incluído** | Modelos Prisma (OutboundTemplate, OutboundLog); APIs CRUD; templates versionados com variáveis; preview e aprovação (dry-run); registro de envio manual; classificação de respostas (IA via z-ai-web-dev-sdk ou manual); opt-out permanente; follow-ups e cadência; relatórios de outbound |
| **Escopo excluído** | Envio automático via wacli/Apify; integração direta com WhatsApp; scraping automático |
| **Dependências** | Release D |
| **Alterações técnicas** | 2 novos modelos Prisma; ~6 novos endpoints API; página de outbound; integração z-ai-web-dev-sdk (server-side) |
| **Compatibilidade** | Adição ao CRM; nenhum envio automático |
| **Feature flag** | `partner_outbound_preview_enabled` = true; `partner_outbound_send_enabled` = false (OFF por padrão) |
| **Dados/migration** | 2 tabelas novas aditivas |
| **Testes** | Dry-run; preview; aprovação; registro manual; classificação; opt-out; follow-up; NENHUM envio automático |
| **Critérios de aceite** | Template criado com variáveis; preview mostra empresa+contato+mensagem; aprovação registra; opt-out permanente; classificação funciona; nenhum disparo externo sem flag explícita |
| **Rollback** | Feature flags off + drop 2 tabelas |
| **Riscos** | Médio — IA pode classificar incorretamente; mitigar com revisão humana |
| **Estimativa** | 4-5 dias |

### Release H — Métricas e Relatórios

| Campo | Valor |
|-------|-------|
| **Objetivo** | Dashboard executivo com KPIs de negócio, relatórios exportáveis e alertas |
| **Escopo incluído** | Dashboard executivo (receita, usuários, parceiros, indicações, app); relatórios CSV/PDF (parceiros, usuários, financeiro, campanhas); alertas (lead sem contato, proposta vencida, campanha expirando); saúde de campanhas; renovação |
| **Escopo excluído** | Alertas via WhatsApp (exige integração externa) |
| **Dependências** | Releases C + D + F + G |
| **Alterações técnicas** | Página de dashboard executivo; página de relatórios; jobs de alertas (idempotentes) |
| **Compatibilidade** | Adição ao admin |
| **Feature flag** | Nenhuma nova (usa flags existentes) |
| **Dados/migration** | Nenhum — usa dados existentes |
| **Testes** | Filtros; exportação; alertas; precisão de números |
| **Critérios de aceite** | Dashboard mostra métricas em tempo real; relatórios exportam corretamente; alertas disparam nos gatilhos corretos |
| **Rollback** | Remover páginas |
| **Riscos** | Baixo |
| **Estimativa** | 3-4 dias |

### Release I — Recursos Avançados

| Campo | Valor |
|-------|-------|
| **Objetivo** | Recursos de maior risco: portal do parceiro, equipes B2B, alertas inteligentes (Radar do Prejuízo), MeuCorre Score |
| **Escopo incluído** | Portal do parceiro (visão restrita de campanhas e métricas); MeuCorre Equipes MVP (organização, convites, painel agregado); Radar do Prejuízo (alertas explicáveis); MeuCorre Score (consistência); Fechamento diário inteligente; Desafio de 7 dias |
| **Escopo excluído** | Dados agregados para terceiros; integração com APIs externas de redes sociais para postagem automática |
| **Dependências** | Todas as releases anteriores validadas |
| **Alterações técnicas** | Novos modelos para Equipes; novos hooks para Radar/Score/Desafio; novos componentes no app |
| **Compatibilidade** | Tudo protegido por feature flags |
| **Feature flag** | `partner_portal_enabled`; `app_radar_enabled`; `app_score_enabled`; `app_challenge_enabled` |
| **Dados/migration** | Tabelas novas aditivas conforme necessário |
| **Testes** | Portal com permissões; equipes com privacidade;雷达 explicável; score não julga; desafio funciona |
| **Critérios de aceite** | Portal acessível apenas com link + auth; equipes preservam privacidade; alertas explicáveis e desligáveis; score mostra evolução |
| **Rollback** | Feature flags off |
| **Riscos** | Alto — privacidade B2B; mitigar com permissões e consentimento |
| **Estimativa** | 7-10 dias |

---

## 9. Especificação Funcional — Central de Divulgação

### 9.1 Visão geral

Nova aba `/admin/divulgacao` no painel admin, protegida por `admin_marketing_hub_enabled`. Permite administrar as 450 publicações do calendário de 90 dias.

### 9.2 Estrutura de dados

Conforme `Prompt para IA de Desenvolvimento — Central de Divulgação do MeuCorre.md`:

- **Campaign**: name, description, objective, startAt, endAt, timezone, status, color, defaultUtm
- **PromotionPost**: campaignId, editorialDay (1-90), sequenceNumber (1-5), publishAt, timezone, platform, format, pillar, title, description, hashtags, engagementText, cta, destinationUrl, altText, videoScript, durationSeconds, status, publishedAt, notes, utmQuery, assetId, createdBy, updatedBy
  - `@@unique([campaignId, editorialDay, sequenceNumber, platform])`
- **PromotionAsset**: name, storageKey, publicUrl, mimeType, width, height, fileSize, altText, source, baseAssetName, tags, hash
- **SocialChannel**: name, platform, profileUrl, bannerUrl, promoTitle, promoText, active, sortOrder
- **PromotionReminder**: postId, remindAt, minutesBefore, channel, status, sentAt

### 9.3 APIs

```
GET    /api/admin/promotion/campaigns
POST   /api/admin/promotion/campaigns
PATCH  /api/admin/promotion/campaigns/:id
DELETE /api/admin/promotion/campaigns/:id

GET    /api/admin/promotion/posts
POST   /api/admin/promotion/posts
PATCH  /api/admin/promotion/posts/:id
DELETE /api/admin/promotion/posts/:id
POST   /api/admin/promotion/posts/import
POST   /api/admin/promotion/posts/bulk-update
POST   /api/admin/promotion/posts/:id/duplicate
POST   /api/admin/promotion/posts/:id/mark-published
GET    /api/admin/promotion/posts/:id/ics
GET    /api/admin/promotion/calendar.ics

GET    /api/admin/promotion/assets
POST   /api/admin/promotion/assets
PATCH  /api/admin/promotion/assets/:id
DELETE /api/admin/promotion/assets/:id
POST   /api/admin/promotion/assets/import

GET    /api/admin/promotion/channels
POST   /api/admin/promotion/channels
PATCH  /api/admin/promotion/channels/:id
DELETE /api/admin/promotion/channels/:id

GET    /api/admin/promotion/reminders
POST   /api/admin/promotion/reminders
PATCH  /api/admin/promotion/reminders/:id
DELETE /api/admin/promotion/reminders/:id
```

### 9.4 Tela de preparação para publicar

Conforme prompt: imagem grande + metadados + botões de cópia (título, descrição, hashtags, engajamento, CTA, link, completo) + download + abrir imagem + marcar como publicada + agendar lembrete.

### 9.5 Canais oficiais

| Canal | Link |
|-------|------|
| Instagram | `https://www.instagram.com/meucorr` |
| TikTok | `https://www.tiktok.com/@meucorr` |
| YouTube | `https://youtube.com/@meucorre-z4j` |
| Facebook | `https://www.facebook.com/share/1QqGSn22NC/` |
| Aplicação | `https://meucorre.vercel.app/` |
| Quiz | `https://meucorre.vercel.app/quiz` |

### 9.6 Importação do calendário

1. Ler `Plano_Divulgacao_MeuCorre_90_Dias.md` ou estrutura JSON intermediária
2. Reconhecer as 450 publicações (90 dias × 5 posts)
3. Preservar ordem mês/dia/postagem
4. Associar imagem correspondente do `MAPA_VISUAL_450_POSTAGENS.md`
5. Validar se todas as 450 imagens existem
6. Detectar duplicatas, horários inválidos, datas ausentes
7. Preview antes de gravar
8. Transação no banco
9. Relatório final (criadas, atualizadas, ignoradas, com erro)
10. Chave única: `campaignId + editorialDay + sequenceNumber + platform`

---

## 10. Especificação Funcional — Central de Parceiros/CRM

### 10.1 Visão geral

Nova aba `/admin/parceiros` no painel admin, protegida por `admin_partner_crm_enabled`. CRM completo de parceiros B2B.

### 10.2 Funil de parceiros

| Estágio | Definição | Condição de entrada | Condição de saída |
|---------|-----------|---------------------|-------------------|
| Novo lead | Empresa não analisada | Cadastro manual, formulário, indicação ou importação | Recebe qualificação inicial |
| Qualificando | Equipe verifica aderência | Categoria, localização e benefício avaliados | Aprovado, desqualificado ou em espera |
| Contato iniciado | Primeira mensagem realizada | Atividade registrada | Reunião marcada, sem resposta ou encerramento |
| Descoberta | Conversa para entender objetivo | Contato respondeu | Informações suficientes para proposta |
| Proposta enviada | Material formal enviado | Proposta com versão e prazo | Negociação, aceite ou perda |
| Negociação | Termos em ajuste | Interesse demonstrado | Acordo, perda ou espera |
| Aguardando aprovação | Contratos/docs em análise | Termos acordados | Ativação ou cancelamento |
| Ativação | Oferta sendo preparada | Parceiro aprovado | Campanha publicada |
| Ativo | Oferta em execução | Publicação concluída | Renovação, pausa ou encerramento |
| Renovação | Período de revisão | Vencimento próximo | Renovada, ampliada ou encerrada |
| Perdido | Não avançou | Motivo registrado | Pode ser reaberta |
| Desqualificado | Não atende critérios | Avaliação negativa | Arquivo histórico |

### 10.3 CRUD de empresa (Partner)

| Etapa | Campos |
|-------|--------|
| Identificação | companyName, tradeName, cnpj, category, origin |
| Localização | city, state, address, website |
| Canais | phone, email, logoUrl |
| Comercial | assignedTo, priority, status, stage |
| Qualificação | relevanceScore, benefitScore, reputationScore, capacityScore, riskScore |

### 10.4 CRUD de contato (PartnerContact)

| Campo | Regra |
|-------|-------|
| name | Obrigatório |
| role | Opcional |
| email | Validar formato |
| phone | Normalizar |
| isPrimary | Boolean |
| optOut | Boolean (default false) — se true, nunca selecionar para envio |
| partnerId | Relação obrigatória |

### 10.5 Dashboard comercial

| Bloco | Informações |
|-------|------------|
| Pipeline | Valor potencial por estágio, quantidade de leads, taxa de conversão |
| Próximas tarefas | Ligações, follow-ups, reuniões, renovações vencendo |
| Parceiros ativos | Ofertas em execução, cidade, categoria, responsável |
| Receita | Contratada, recebida, prevista, vencida |
| Saúde das campanhas | Sem clique, com reclamação, perto do vencimento |
| Alertas | Leads sem contato, proposta vencida, documento pendente |

---

## 11. Especificação — Outbound Supervisionado

### 11.1 Princípios

1. **O sistema prepara; o administrador executa.** Nenhum envio automático.
2. **Dry-run obrigatório.** Preview antes de qualquer contato.
3. **Opt-out permanente.** Contato com opt-out nunca é selecionado.
4. **Logs de tudo.** Cada preparação, aprovação, envio manual e resposta.
5. **Sem anti-ban.** Usar canais oficiais e autorizados. Não burlar limites de plataformas.
6. **Volume controlado.** Lotes pequenos, revisão humana, sem spam.

### 11.2 Templates de mensagem (OutboundTemplate)

| Campo | Regra |
|-------|-------|
| name | Identificação (ex: "Oficina local — primeiro contato") |
| channel | email, whatsapp, linkedin, phone |
| segment | Categoria e região |
| objective | permission, discovery, proposal, follow_up, renewal |
| body | Template com variáveis: {NOME}, {EMPRESA}, {CIDADE}, {CATEGORIA}, {MOTIVO} |
| cta | Pequeno e claro |
| optOutText | Texto de opt-out |
| status | draft, approved, paused, archived |
| version | Histórico de alteração |

### 11.3 Status de envio (OutboundLog)

| Status | Significado |
|--------|------------|
| preparado | Mensagem e lead prontos, nada enviado |
| aguardando_aprovacao | Precisa de revisão comercial |
| enviado | Administrador confirmou envio manual |
| respondeu | Resposta capturada |
| interessado | Resposta indica intenção comercial |
| reuniao_marcada | Data e horário definidos |
| proposta_enviada | Oferta formal enviada |
| negociacao | Termos em discussão |
| ganho | Parceria aprovada |
| ativo | Campanha publicada |
| opt_out | Contato pediu encerramento |
| perdido | Oportunidade encerrada com motivo |
| erro | Falha técnica |

### 11.4 Classificação de respostas

| Resposta | Classificação | Próxima ação |
|----------|--------------|--------------|
| "pode mandar", "manda", "me mostra" | permission_to_send | Enviar resumo curto |
| "tenho interesse", "quero saber mais" | interessado | Perguntar objetivo, região, capacidade |
| "quanto custa?" | pricing_question | Explicar formato, oferecer conversa |
| "vamos marcar", "pode amanhã" | meeting_ready | Oferecer dois horários |
| "não tenho interesse", "não precisa" | opt_out | Confirmar respeito, bloquear follow-up |
| "agora não" | nurture_future | Perguntar quando retomar |
| Ambígua | ambiguous | Pergunta curta ou escalar |
| Reclamação | risk | Parar contato, registrar, revisar |

### 11.5 Fluxo de operação

1. Administrador seleciona leads qualificados no CRM
2. Sistema gera mensagem personalizada a partir de template
3. Administrador revisa preview (dry-run)
4. Administrador aprova ou ajusta individualmente
5. Administrador envia manualmente pelo canal escolhido (WhatsApp, email, etc.)
6. Administrador registra o envio no sistema (status: enviado)
7. Sistema monitora respostas (administrador classifica manualmente ou via IA)
8. Sistema atualiza status do lead e cria follow-up se necessário
9. Opt-outs são permanentes

---

## 12. Plano de Dados, Privacidade, Segurança e Auditoria

### 12.1 Privacidade (LGPD)

| Princípio | Aplicação |
|-----------|-----------|
| Finalidade | Declarar para que o dado será usado antes da coleta |
| Minimização | Coletar apenas o necessário para o recurso solicitado |
| Consentimento | Opt-in para prospecção; opt-out permanente |
| Transparência | Política compreensível e histórico de escolhas |
| Segurança | Controle de acesso, criptografia, logs, revisão periódica |
| Não discriminação | Não usar dados para penalizar trabalhadores |

### 12.2 Auditoria

| Ação | Registrada em | Campos |
|------|---------------|--------|
| Criar/editar/excluir empresa | PartnerLog | partnerId, action, details, adminId, adminEmail, ipAddress, createdAt |
| Mover estágio de oportunidade | PartnerLog | partnerId, action="stage_changed", details (old → new) |
| Aprovar/rejeitar campanha | PartnerLog + AdminAction | action, resourceId, details |
| Enviar mensagem outbound | OutboundLog | partnerId, contactId, templateId, status, sentAt |
| Marcar opt-out | PartnerContact.optOut + PartnerLog | action="opt_out" |
| Importar leads | PartnerLog | action="import", details (count, source) |
| Exportar dados | AdminAction | action="export", resource, details |

### 12.3 Segurança

| Área | Medida |
|------|--------|
| Auth admin | Cookie httpOnly + JWT (existente) |
| Auth user | Cookie httpOnly + JWT (existente) |
| Rate limit | Upstash Redis (existente) |
| Validação de entrada | `src/lib/validation.ts` (existente) — usar em todos os novos endpoints |
| Upload de arquivos | Validar formato, tamanho, tipo MIME |
| Secrets | Somente env vars na Vercel; nunca no código |
| HTTPS | Vercel provê automaticamente |
| CSP | Configurado em `next.config.ts` (existente) |

---

## 13. Matriz de Testes de Regressão e QA

| Categoria | Cenários | Tipo | Ambiente |
|-----------|----------|------|----------|
| Regressão do núcleo | Corridas: criar, editar, excluir, listar, filtrar | E2E + Manual | Local + Prod |
| Regressão do núcleo | Despesas: criar, editar, excluir, listar, filtrar | E2E + Manual | Local + Prod |
| Regressão do núcleo | Lucro líquido: cálculo correto | Unit | Local |
| Regressão do núcleo | Gráficos: renderizam com dados | E2E | Local + Prod |
| Regressão do núcleo | Metas: criar, progresso, excluir | E2E | Local + Prod |
| Regressão do núcleo | Corre do dia: iniciar, cronômetro, finalizar | E2E | Local + Prod |
| Regressão do núcleo | Mapa de calor: abre, mostra mapa | E2E | Local + Prod |
| Regressão do núcleo | Onboarding: abre, navega, fecha | E2E | Local + Prod |
| Auth | Login user, login admin, logout, sessão expirada | E2E | Local + Prod |
| Auth | Registro via quiz → trial 14 dias | E2E | Local + Prod |
| PWA | Instalação (Android/Chrome) | Manual | Prod |
| PWA | Offline: abrir sem rede, lançar corrida | Manual | Prod |
| Pagamentos | Trial → checkout Kiwify → webhook → licença | E2E | Local (mock) |
| Indicação | Código gerado, link compartilhado, conversão | E2E | Local + Prod |
| Admin atual | Anúncios CRUD, assinaturas, feedbacks, blog | E2E | Local + Prod |
| Divulgação | Importação 450 posts sem duplicação | Integration | Local |
| Divulgação | Cópia de cada campo individual + completo | E2E | Local |
| Divulgação | Download da imagem correta | E2E | Local |
| Divulgação | ICS com fuso correto | Unit + E2E | Local |
| Divulgação | Filtros por plataforma, mês, status | E2E | Local |
| CRM | CRUD empresa, contato, lead | E2E | Local |
| CRM | Deduplicação por telefone, nome, domínio | Unit | Local |
| CRM | Pipeline Kanban drag & drop | E2E | Local |
| CRM | Importação CSV com preview | E2E | Local |
| CRM | Permissões por papel | E2E | Local |
| CRM | Auditoria registra alterações | Integration | Local |
| Campanhas | Aprovação, vigência, pausa, denúncia | E2E | Local |
| Campanhas | Anúncios existentes NÃO são afetados | Regression | Local + Prod |
| Outbound | Dry-run mostra preview correto | E2E | Local |
| Outbound | Opt-out permanente | Integration | Local |
| Outbound | NENHUM envio automático sem flag | Security | Local |
| Segurança | Acesso negado sem auth admin | E2E | Local + Prod |
| Segurança | Validação de entrada em novos endpoints | Unit | Local |
| Performance | Lista de 450 posts com filtros | Manual | Local |
| Performance | CRM com 1000+ empresas | Manual | Local |
| Mobile | Divulgação em 390px | Manual | Local |
| Mobile | CRM em 390px | Manual | Local |

---

## 14. Matriz de Riscos, Mitigação, Monitoramento e Contingência

| Risco | Probabilidade | Impacto | Mitigação | Monitoramento | Contingência |
|-------|--------------|---------|-----------|---------------|--------------|
| Build quebra em produção | Baixa | Alto | Testar localmente antes de push | CI/CD (quando reativado) | Reverter commit |
| Migration falha no Postgres | Baixa | Alto | Testar em dev primeiro; migration aditiva | Logs do `prisma db push` | Reverter migration (drop table nova) |
| Dados de produção afetados | Baixa | Crítico | Nunca modificar tabelas existentes | Sentry + logs | Restore do backup Supabase (7 dias) |
| URLs do manifest.json expiram | Alta | Médio | Baixar todos os assets antes da Release C | Verificar URLs | Re-gerar assets |
| 4 artes de vendas ausentes | Certeza | Baixo | Usar 16 disponíveis; gerar 4 posteriormente | Inventário | Não bloqueia Release C |
| UI quebra em mobile | Média | Médio | Testar em 390px em cada release | Browser testing | Ajustar CSS |
| IA classifica resposta incorretamente | Média | Baixo | Revisão humana sempre disponível | Logs de classificação | Classificar manualmente |
| Feature flag não desliga | Baixa | Alto | Testar flag off antes de deploy | Verificar Setting table | Delete da row de flag |
| PWA cache serve versão antiga | Média | Médio | Service worker com versionamento | Console do browser | Unregister SW + hard refresh |
| Vercel deploy falha (OOM) | Média | Alto | `typescript.ignoreBuildErrors: true` (já configurado) | Vercel build logs | Reverter commit |
| Permissão ampliada por acidente | Baixa | Alto | Testar papéis antes de deploy | Logs de auditoria | Reverter papéis |

---

## 15. Roadmap por Prioridade e Dependência

| Ordem | Release | Duração estimada | Dependências | Prioridade |
|-------|---------|-----------------|--------------|------------|
| 0 | A — Baseline e proteção | 1-2 dias | Nenhuma | Crítica |
| 1 | B — Fundação administrativa | 1 dia | A | Crítica |
| 2 | C — Central de Divulgação | 5-7 dias | B + assets | Alta |
| 3 | D — CRM básico | 5-7 dias | B | Alta |
| 4 | E — Propostas e materiais | 3-4 dias | D | Média |
| 5 | F — Campanhas e ofertas | 3-4 dias | D + E | Alta |
| 6 | G — Outbound supervisionado | 4-5 dias | D | Média |
| 7 | H — Métricas e relatórios | 3-4 dias | C + D + F + G | Média |
| 8 | I — Recursos avançados | 7-10 dias | Todas | Baixa |

**Total estimado:** 32-44 dias úteis (6-9 semanas) para Releases A-I.

**Releases C e D podem ser paralelizadas** (dependem apenas de B, não uma da outra).

---

## 16. Decisões do Responsável pelo Produto (Respondidas em 12/08/2026)

| # | Pergunta | Resposta | Impacto no plano |
|---|----------|----------|-----------------|
| 1 | Qual cidade-piloto para o CRM? | **Pernambuco-Recife** | Release D: leads iniciais focados em Recife/PE; templates personalizados para região |
| 2 | Qual categoria inicial? | **Serviços em geral do nicho** (amplo: oficinas, pneus, acessórios, alimentação, proteção, etc.) | Release D: categorias múltiplas desde o início; templates por categoria |
| 3 | Responsável comercial? | **Clodoaldo Silva** | `assignedTo` = "Clodoaldo Silva" em todos os leads iniciais |
| 4 | 450 imagens disponíveis? | **Usuário fará upload via admin** — criar seção de upload na página admin | Release C: adicionar UI de upload de arquivo ZIP/pasta de imagens; sistema processa e vincula aos posts |
| 5 | Vitalício R$ 18,90 vigente? | **Sim, continua** | Manter preço atual; não alterar checkout |
| 6 | Reativar GitHub Actions CI? | **Sim, sem dar erro nos commits** | Reativar CI com workflow que não bloqueia commits (warn-only ou CI otimizado sem build) |
| 7 | Modelo de cobrança para parceiros? | **Por campanha E por lead** (ambos) | Release E/F: templates de proposta com ambos os modelos; tabela de preços configurável |
| 8 | Canal de outbound? | **Ambos (WhatsApp e email)** | Release G: templates para ambos os canais; `OutboundTemplate.channel` aceita "whatsapp" e "email" |
| 9 | Implementar Equipes (B2B)? | **Sim, no curto prazo** | Release I: trazida para o escopo imediato; MVP de Equipes incluído no roadmap principal |
| 10 | Continuar no Blogger externo? | **Sim** | Manter integração Blogger OAuth2 existente; não modificar |

### 16.1 Decisões adicionais baseadas nas respostas

- **Upload de imagens na Central de Divulgação:** Criar seção `/admin/divulgacao/assets` com upload de arquivo ZIP contendo as 450 imagens organizadas por mês/dia/postagem. O sistema descompacta, processa, vincula aos posts pelo nome do arquivo e registra no `PromotionAsset`.
- **CI sem bloqueio:** Reativar GitHub Actions com workflow que roda `tsc --noEmit` e `eslint` mas usa `continue-on-error: true` para não bloquear commits se houver warnings (repositório privado com limite de minutos).
- **Equipes B2B no curto prazo:** Release I é movida para logo após Release H (não mais "longo prazo"). MVP: criar organização, convidar membros, painel agregado, benefícios.
- **Modelo duplo de cobrança:** `PartnerCampaign` suporta `billingModel: "campaign" | "lead" | "both"`. Propostas incluem os dois modelos.

---

## 17. Checklist de Go/No-Go Antes de Qualquer Deploy

### Antes de iniciar qualquer release:

- [ ] Release anterior (se houver) está em produção e estável
- [ ] Branch de trabalho criada (não trabalhar direto em main)
- [ ] `git status --short` limpo
- [ ] `npx tsc --noEmit` passa sem erros
- [ ] `npx eslint src/ --max-warnings 0` passa sem erros
- [ ] `npm run build` passa sem erros
- [ ] Testes de regressão do núcleo passam (corridas, despesas, lucro, auth)
- [ ] Feature flags da nova release estão OFF
- [ ] Migrations são aditivas (nenhuma tabela existente modificada)
- [ ] Nenhum secret no código
- [ ] Nenhum `console.log` de debug em produção
- [ ] Plano de rollback documentado

### Antes de cada commit atômico:

- [ ] Unidade declarada (objetivo, escopo, arquivos, risco, flag, critério de aceite)
- [ ] `git status --short` registra ponto de partida
- [ ] Diff é pequeno e coerente
- [ ] Lint passa (código zero)
- [ ] Type-check passa (código zero)
- [ ] Build passa (código zero)
- [ ] Testes aplicáveis passam
- [ ] Validação manual do fluxo novo
- [ ] Validação de regressão do fluxo antigo
- [ ] `git diff --check` sem problemas
- [ ] `git add -- <arquivos-revisados>` (não `git add .`)
- [ ] Commit atômico criado
- [ ] `git show --check --stat HEAD` verificado
- [ ] `git status --short` limpo
- [ ] `docs/IMPLEMENTATION_LOG.md` atualizado

### Antes de deploy em produção:

- [ ] Todas as feature flags da nova release estão OFF em produção
- [ ] Build de produção passa localmente
- [ ] Migrations testadas em dev
- [ ] Nenhuma tabela existente modificada
- [ ] Nenhum endpoint existente alterado
- [ ] Plano de rollback pronto
- [ ] Sentry configurado para monitorar novos endpoints
- [ ] Log de implementação completo

---

## 18. Referências aos Arquivos e Fontes Analisados

### Documentos estratégicos

1. `upload/Estudo Estratégico do MeuCorre.md` — 927 linhas, 23 seções
2. `upload/Estratégia de Parceiros e Central CRM do MeuCorre.md` — 691 linhas, 18 seções
3. `upload/Análise e Aperfeiçoamento da Operação Outbound do MeuCorre.md` — 522 linhas, 13 seções
4. `upload/meucorre_diagnostico_produto.md` — 10 linhas
5. `upload/meu-corre_estado_retomada.md` — 17 linhas

### Documentos de divulgação

6. `upload/Prompt para IA de Desenvolvimento — Central de Divulgação do MeuCorre.md` — 559 linhas
7. `upload/Plano_Divulgacao_MeuCorre_90_Dias.md` — 6089 linhas
8. `upload/PLANO_DIVULGACAO_90_DIAS_COM_IMAGENS.md` — ~6000 linhas
9. `upload/MAPA_VISUAL_450_POSTAGENS.md` — 465 linhas
10. `upload/Pacote Visual do MeuCorre — 90 Dias.md` — 22 linhas

### Kit comercial

11. `upload/Kit Comercial Consolidado — MeuCorre.md` — 44 linhas
12. `upload/guia_mascotes_extraido.txt` — 157 linhas
13. `upload/manus.im_share_bFmdFxz5y6it3tGjrXCA8W.md` — 52 linhas
14. `upload/manifest.json` — 251 linhas (35 assets com URLs)
15. `upload/Arquivos adicionais encontrados no fim do painel.md` — 17 linhas

### Documentos técnicos

16. `upload/github.com_clodoaldosilva608_MeuCorre.md` — 1030 linhas (README do GitHub)
17. `upload/SKILL.md` — 151 linhas (Skill de roteamento visual)
18. `upload/.safety_warning.md` — 71 linhas (Protocolo de segurança)

### Skill outbound

19. `upload/agencia-outbound-unificada-SKILL.md` — 843 linhas

### Scripts Python

20. `upload/auditar_ativos_plano_meucorre.py` — 50 linhas
21. `upload/extract_meu_corre_assets.py` — 61 linhas
22. `upload/extract_doc_text.py` — 18 linhas
23. `upload/gerar_plano_divulgacao_meucorre.py` — 449 linhas
24. `upload/create_contact_sheet.py` — 28 linhas

### Código do repositório (análise in-loco)

25. `prisma/schema.prisma` — 423 linhas, 20+ modelos
26. `src/app/api/` — 30+ rotas API
27. `src/components/meucorre/` — 30+ componentes
28. `src/hooks/` — 8 hooks
29. `src/lib/` — 10+ módulos
30. `src/app/admin/` — 8 páginas admin
31. `next.config.ts`, `vercel.json`, `package.json`
32. `src/app/globals.css` — design system premium

### Prompt de planejamento

33. `upload/Pasted Content_1786513990088.txt` — 524 linhas (prompt de plano seguro e incremental)

---

> **Este plano está pronto para revisão. Nenhuma implementação deve começar até aprovação explícita do responsável pelo produto.**
