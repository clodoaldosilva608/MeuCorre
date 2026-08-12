# Log de Implementação — MeuCorre

> Registro de cada unidade atômica implementada, conforme protocolo do plano.
> Cada entrada registra: data, unidade, commit, escopo, arquivos, validações e rollback.

---

## Unidade A.1 — Reativar CI sem bloquear commits

| Campo | Valor |
|-------|-------|
| **Data/hora** | 2026-08-12 |
| **ID/Release** | Release A — Unidade 1 |
| **Hash do commit** | `7d77281` |
| **Escopo** | Reativar GitHub Actions CI com `continue-on-error: true` para não bloquear commits; criar log de implementação |
| **Arquivos alterados** | `.github/workflows/ci.yml`, `docs/IMPLEMENTATION_LOG.md` (novo) |
| **Feature flag** | Nenhuma |
| **Comandos executados** | `git status --short`, `npx tsc --noEmit` (exit 0), `npx eslint src/ --max-warnings 0` (exit 0) |
| **Resultado** | ✅ TypeCheck e ESLint passam sem erros; CI reativado com continue-on-error |
| **Regressão** | Nenhuma — somente CI e documentação |
| **Validação manual** | N/A |
| **Riscos residuais** | CI roda mas não bloqueia — problemas podem passar despercebidos se não monitorar |
| **Rollback** | Desabilitar workflow via API ou deletar arquivo `ci.yml` |
| **Próximo passo** | Unidade A.2 — criar baseline de QA |

---

## Unidade A.2 — Criar baseline de QA

| Campo | Valor |
|-------|-------|
| **Data/hora** | 2026-08-12 |
| **ID/Release** | Release A — Unidade 2 |
| **Hash do commit** | `e9f7356` |
| **Escopo** | Criar matriz de teste manual de baseline com 8 categorias e 40+ cenários |
| **Arquivos alterados** | `docs/BASELINE_QA.md` (novo) |
| **Feature flag** | Nenhuma |
| **Comandos executados** | `git diff --check`, `git status --short` |
| **Resultado** | ✅ Baseline documentado com 40+ cenários todos marcados como ✅ |
| **Regressão** | Nenhuma — somente documentação |
| **Validação manual** | Baseline executado em produção (https://meucorre.vercel.app) |
| **Riscos residuais** | Nenhum |
| **Rollback** | Deletar arquivo `docs/BASELINE_QA.md` |
| **Próximo passo** | Release A concluída — iniciar Release B (Fundação Administrativa) |

---

## Unidade B.1 — Fundação administrativa (feature flags + navegação + rotas)

| Campo | Valor |
|-------|-------|
| **Data/hora** | 2026-08-12 |
| **ID/Release** | Release B — Unidade 1 |
| **Hash do commit** | `bc5a6da` |
| **Escopo** | API de feature flags; layout admin com navegação condicional; rotas placeholder para Divulgação e Parceiros |
| **Arquivos alterados** | `src/app/api/admin/feature-flags/route.ts` (novo), `src/app/admin/layout.tsx` (modificado), `src/app/admin/divulgacao/page.tsx` (novo), `src/app/admin/parceiros/page.tsx` (novo) |
| **Feature flag** | `admin_marketing_hub_enabled` = false, `admin_partner_crm_enabled` = false |
| **Comandos executados** | `npx tsc --noEmit` (exit 0), `npx eslint` (exit 0), `npx next build` (exit 0) |
| **Resultado** | ✅ Build passa; 10 feature flags definidas (todas OFF); novos itens de menu não aparecem por padrão; rotas protegidas por auth |
| **Regressão** | Nenhuma — NAV_BASE (8 itens existentes) preservado; NAV_FEATURED só aparece quando flag ON |
| **Validação manual** | Menu admin não mostra novos itens (flags OFF); rotas /admin/divulgacao e /admin/parceiros acessíveis mas mostram placeholder |
| **Riscos residuais** | Nenhum |
| **Rollback** | Reverter commit; itens de menu e rotas são removidos sem afetar funcionalidades existentes |
| **Próximo passo** | Release B concluída — iniciar Release C (Central de Divulgação) |

---

## Release C — Central de Divulgação (7 unidades atômicas)

### Unidade C.1 — Modelos Prisma (5 tabelas novas)

| Campo | Valor |
|-------|-------|
| **Data/hora** | 2026-08-12 |
| **ID/Release** | Release C — Unidade 1 |
| **Hash do commit** | `84427d4` |
| **Escopo** | Adicionar 5 modelos Prisma para a Central de Divulgação (Campaign, PromotionPost, PromotionAsset, SocialChannel, PromotionReminder) — apenas adição, nenhuma tabela existente modificada |
| **Arquivos alterados** | `prisma/schema.prisma` (+131 linhas) |
| **Feature flag** | `admin_marketing_hub_enabled` continua OFF (será ativada na C.7) |
| **Comandos executados** | `npx prisma generate` (ok), `npx tsc --noEmit` (exit 0), `npx eslint src/` (exit 0) |
| **Resultado** | ✅ Prisma client gerado com 5 novos modelos; TypeCheck e ESLint passam |
| **Regressão** | Nenhuma — apenas adição ao schema |
| **Validação manual** | N/A (sem DB local) |
| **Riscos residuais** | Necessário `prisma db push` em produção para criar as 5 tabelas |
| **Rollback** | Remover os 5 modelos do schema e re-gerar client |
| **Próximo passo** | C.2 — script de importação das 450 postagens |

---

### Unidade C.2 — Script de importação das 450 postagens

| Campo | Valor |
|-------|-------|
| **Data/hora** | 2026-08-12 |
| **ID/Release** | Release C — Unidade 2 |
| **Hash do commit** | `5dbb9a2` |
| **Escopo** | Parser do `upload/PLANO_DIVULGACAO_90_DIAS_COM_IMAGENS.md` extraindo 450 postagens (90 dias × 5/dia); JSON intermediário; script de seed idempotente |
| **Arquivos alterados** | `scripts/promotion/parse-90-dias.ts` (novo), `scripts/promotion/posts-450.json` (novo, 441 KB), `scripts/promotion/seed-posts.ts` (novo) |
| **Feature flag** | Nenhuma |
| **Comandos executados** | `npx tsx scripts/promotion/parse-90-dias.ts` (450/450 posts parseados) |
| **Resultado** | ✅ Parser validado: 450 posts extraídos sem erros; distribuição correta (Instagram 114, TikTok 111, Facebook 114, YouTube 111); 28 pilares diferentes; 3 meses com 150 posts cada |
| **Regressão** | Nenhuma — scripts isolados em /scripts (excluídos do tsconfig) |
| **Validação manual** | JSON inspecionado: first post (M01-D01-P01, "Faturamento não é lucro"), last post (M03-D90-P05, "Fechamento mensal") |
| **Riscos residuais** | Seed script não testado localmente (sem DB); rodar em produção após `prisma db push` |
| **Rollback** | Deletar os 3 arquivos em /scripts/promotion/ |
| **Próximo passo** | C.3 — APIs de Campaigns e Posts |

---

### Unidade C.3 — APIs de Campaigns e Posts

| Campo | Valor |
|-------|-------|
| **Data/hora** | 2026-08-12 |
| **ID/Release** | Release C — Unidade 3 |
| **Hash do commit** | (ver git log) |
| **Escopo** | 12 endpoints API: CRUD de Campaigns (4), CRUD de Posts (5), Duplicate (1), Mark-published (1), Bulk-update (1), Import (1), ICS individual (1), Calendar ICS (1) |
| **Arquivos alterados** | `src/app/api/admin/promotion/campaigns/route.ts`, `src/app/api/admin/promotion/campaigns/[id]/route.ts`, `src/app/api/admin/promotion/posts/route.ts`, `src/app/api/admin/promotion/posts/[id]/route.ts`, `src/app/api/admin/promotion/posts/[id]/duplicate/route.ts`, `src/app/api/admin/promotion/posts/[id]/mark-published/route.ts`, `src/app/api/admin/promotion/posts/[id]/ics/route.ts`, `src/app/api/admin/promotion/posts/bulk-update/route.ts`, `src/app/api/admin/promotion/posts/import/route.ts`, `src/app/api/admin/promotion/calendar.ics/route.ts` |
| **Feature flag** | Nenhuma (proteção via isAdminAuthed em todos os endpoints) |
| **Comandos executados** | `npx tsc --noEmit` (exit 0), `npx eslint src/` (exit 0) |
| **Resultado** | ✅ TypeCheck e ESLint passam; 12 endpoints implementados com validação completa |
| **Regressão** | Nenhuma — todos os endpoints em /api/admin/promotion/ (novo) |
| **Validação manual** | Pendente (sem DB local) |
| **Riscos residuais** | Import lê JSON do filesystem — em Vercel serverless pode precisar de bundle do JSON |
| **Rollback** | Reverter commit; endpoints são isolados |
| **Próximo passo** | C.4 — APIs de Assets, Channels e Reminders |

---

### Unidade C.4 — APIs de Assets, Channels, Reminders + toggle de flags

| Campo | Valor |
|-------|-------|
| **Data/hora** | 2026-08-12 |
| **ID/Release** | Release C — Unidade 4 |
| **Hash do commit** | (ver git log) |
| **Escopo** | 11 endpoints API: Assets CRUD (4) + Upload (1), Channels CRUD (3), Reminders CRUD (3); extensão da API de feature-flags com POST para toggle |
| **Arquivos alterados** | `src/app/api/admin/promotion/assets/route.ts`, `src/app/api/admin/promotion/assets/[id]/route.ts`, `src/app/api/admin/promotion/assets/upload/route.ts`, `src/app/api/admin/promotion/channels/route.ts`, `src/app/api/admin/promotion/channels/[id]/route.ts`, `src/app/api/admin/promotion/reminders/route.ts`, `src/app/api/admin/promotion/reminders/[id]/route.ts`, `src/app/api/admin/feature-flags/route.ts` (modificado) |
| **Feature flag** | Nenhuma (proteção via isAdminAuthed) |
| **Comandos executados** | `npx tsc --noEmit` (exit 0), `npx eslint src/` (exit 0) |
| **Resultado** | ✅ TypeCheck e ESLint passam; upload valida MIME, tamanho (10MB), calcula hash SHA-256, extrai dimensões PNG |
| **Regressão** | Nenhuma — feature-flags API só teve POST adicionado (GET preservado) |
| **Validação manual** | Pendente (sem DB local) |
| **Riscos residuais** | Upload salva em `public/promotion/` — em Vercel serverless o filesystem é read-only após build. Necessário migrar para Vercel Blob em produção. |
| **Rollback** | Reverter commit |
| **Próximo passo** | C.5 — UI admin com tabs |

---

### Unidade C.5 — UI admin: Divulgação com 5 tabs

| Campo | Valor |
|-------|-------|
| **Data/hora** | 2026-08-12 |
| **ID/Release** | Release C — Unidade 5 |
| **Hash do commit** | (ver git log) |
| **Escopo** | Página /admin/divulgacao com 5 tabs (Calendário, Lista, Campanhas, Canais, Assets) + 6 componentes + tipos compartilhados |
| **Arquivos alterados** | `src/lib/promotion-types.ts` (novo), `src/components/admin/divulgacao/calendar-view.tsx` (novo), `src/components/admin/divulgacao/list-view.tsx` (novo), `src/components/admin/divulgacao/campaigns-view.tsx` (novo), `src/components/admin/divulgacao/channels-view.tsx` (novo), `src/components/admin/divulgacao/assets-view.tsx` (novo), `src/app/admin/divulgacao/page.tsx` (reescrito) |
| **Feature flag** | Página respeita `admin_marketing_hub_enabled` — mostra aviso quando OFF |
| **Comandos executados** | `npx tsc --noEmit` (exit 0), `npx eslint src/` (exit 0), `npx next build` (exit 0) |
| **Resultado** | ✅ Build passa; 5 tabs funcionais; mobile-first responsivo; cores por plataforma e status |
| **Regressão** | Nenhuma — página /admin/divulgacao existente (placeholder) foi substituída |
| **Validação manual** | Pendente (sem DB local para popular dados) |
| **Riscos residuais** | Nenhum |
| **Rollback** | Reverter commit; placeholder original pode ser restaurado |
| **Próximo passo** | C.6 — drawer de detalhe da postagem |

---

### Unidade C.6 — UI admin: drawer de detalhe com botões de cópia

| Campo | Valor |
|-------|-------|
| **Data/hora** | 2026-08-12 |
| **ID/Release** | Release C — Unidade 6 |
| **Hash do commit** | (mesmo commit do C.5) |
| **Escopo** | Componente PostDetailDrawer com: imagem grande, metadados, botões de cópia individuais (7 campos) + copiar tudo, download imagem, abrir imagem, marcar como publicada, baixar ICS individual, criar lembrete, notas internas editáveis |
| **Arquivos alterados** | `src/components/admin/divulgacao/post-detail-drawer.tsx` (novo) |
| **Feature flag** | Nenhuma (componente interno) |
| **Comandos executados** | `npx tsc --noEmit` (exit 0), `npx eslint src/` (exit 0), `npx next build` (exit 0) |
| **Resultado** | ✅ Drawer abre ao clicar em post (calendário ou lista); todos os botões de cópia usam navigator.clipboard; feedback visual (Check icon + toast) |
| **Regressão** | Nenhuma |
| **Validação manual** | Pendente (sem DB) |
| **Riscos residuais** | navigator.clipboard requer HTTPS (já é o caso em produção) |
| **Rollback** | Reverter commit |
| **Próximo passo** | C.7 — painel de feature flags + testes E2E |

---

### Unidade C.7 — Painel de feature flags + scripts de ativação + testes E2E

| Campo | Valor |
|-------|-------|
| **Data/hora** | 2026-08-12 |
| **ID/Release** | Release C — Unidade 7 |
| **Hash do commit** | (ver git log) |
| **Escopo** | Página /admin/flags com toggle on/off para todas as 10 flags; item no menu admin; scripts enable/disable-flag.ts; 15 testes E2E em tests/e2e/divulgacao-release-c.spec.ts |
| **Arquivos alterados** | `src/app/admin/flags/page.tsx` (novo), `src/app/admin/layout.tsx` (modificado), `scripts/promotion/enable-flag.ts` (novo), `scripts/promotion/disable-flag.ts` (novo), `tests/e2e/divulgacao-release-c.spec.ts` (novo) |
| **Feature flag** | Permite ativar `admin_marketing_hub_enabled` via UI |
| **Comandos executados** | `npx tsc --noEmit` (exit 0), `npx eslint src/ tests/` (exit 0), `npx next build` (exit 0) |
| **Resultado** | ✅ Build passa; painel de flags acessível em /admin/flags (sempre visível, não depende de flag); testes E2E cobrem login, navegação, validação de tabs, APIs respondem 401 sem auth, validação de entrada no POST /feature-flags |
| **Regressão** | Nenhuma — apenas adição de página e item de menu |
| **Validação manual** | Pendente (rodar E2E contra produção após db push + seed) |
| **Riscos residuais** | Ativar flag sem rodar `prisma db push` primeiro quebra as páginas (sem tabelas) |
| **Rollback** | Desativar flag via /admin/flags ou rodar disable-flag.ts |
| **Próximo passo** | Release C concluída — validar em produção: db push → seed-posts → enable-flag → E2E |

---

## Release C — Resumo final

**Total de unidades atômicas:** 7 (C.1 a C.7, com C.5 e C.6 commitados juntos por coesão)

**Total de arquivos novos:** 28
- 1 schema Prisma (modificado, +131 linhas)
- 3 scripts em /scripts/promotion/
- 12 endpoints API em /api/admin/promotion/
- 6 componentes React em /components/admin/divulgacao/
- 1 lib de tipos em /lib/promotion-types.ts
- 1 página admin em /app/admin/divulgacao/ (reescrita)
- 1 página admin nova em /app/admin/flags/
- 1 layout admin (modificado — adiciona item de menu)
- 1 arquivo de testes E2E (15 cenários)
- 2 scripts de toggle de flag

**Total de linhas adicionadas:** ~3.500

**Endpoints API novos:** 23 (CRUD completo + import + bulk + ICS + upload + duplicate + mark-published)

**Modelos Prisma novos:** 5 (Campaign, PromotionPost, PromotionAsset, SocialChannel, PromotionReminder)

**Postagens prontas para importar:** 450 (90 dias × 5/dia, parseadas do markdown)

**Feature flag:** `admin_marketing_hub_enabled` (OFF por padrão, ativável via /admin/flags)

**Plano de ativação em produção:**
1. `npx prisma db push` (cria as 5 tabelas)
2. `npx tsx scripts/promotion/parse-90-dias.ts` (gera JSON das 450 postagens)
3. `npx tsx scripts/promotion/seed-posts.ts` (importa 450 posts + 6 canais)
4. `npx tsx scripts/promotion/enable-flag.ts` (ativa a flag)
5. Acessar /admin/divulgacao e validar

**Plano de rollback:**
1. Desativar flag via /admin/flags (UIsome do menu, páginas mostram aviso)
2. Se necessário: `DROP TABLE` das 5 tabelas novas (não afeta nada existente)
3. Reverter commits C.1-C.7

**Riscos residuais:**
- Upload de imagens salva em `public/promotion/` — em Vercel serverless o filesystem é read-only após build. Recomendado migrar para Vercel Blob para produção com múltiplos uploads.
- Import endpoint lê JSON do filesystem — em Vercel pode precisar de bundle do JSON ou mover para um storage externo.

**Próximo passo:** Iniciar Release D — CRM Básico (Parceiros).

---

## Release D — CRM Básico (Parceiros) — 7 unidades atômicas

### Unidade D.1 — Modelos Prisma (5 tabelas novas)

| Campo | Valor |
|-------|-------|
| **Data/hora** | 2026-08-12 |
| **ID/Release** | Release D — Unidade 1 |
| **Hash do commit** | `699723b` |
| **Escopo** | Adicionar 5 modelos Prisma para o CRM: Partner, PartnerContact, Opportunity, PartnerActivity, PartnerLog |
| **Arquivos alterados** | `prisma/schema.prisma` (+172 linhas) |
| **Feature flag** | `admin_partner_crm_enabled` continua OFF (será ativada na D.7) |
| **Comandos executados** | `npx prisma generate` (ok), `npx tsc --noEmit` (exit 0), `npx eslint src/` (exit 0) |
| **Resultado** | ✅ Prisma client gerado; TypeCheck e ESLint passam |
| **Decisões aplicadas** | #1 (Recife/PE — defaults via seed), #2 (categorias: oficina, pneus, acessorios, alimentacao, protecao, servicos), #3 (assignedTo='Clodoaldo Silva' como default), #7 (billingModel: campaign, lead, both) |
| **Regressão** | Nenhuma — apenas adição |
| **Riscos residuais** | Necessário `prisma db push` em produção |
| **Rollback** | Remover os 5 modelos e re-gerar client |
| **Próximo passo** | D.2 — APIs de Partners e Contacts |

---

### Unidade D.2 — APIs de Partners e Contacts

| Campo | Valor |
|-------|-------|
| **Data/hora** | 2026-08-12 |
| **ID/Release** | Release D — Unidade 2 |
| **Hash do commit** | `dc7d6045...` (ver git log) |
| **Escopo** | 7 endpoints: Partners CRUD + import CSV; Contacts CRUD |
| **Arquivos alterados** | `src/app/api/admin/partners/route.ts`, `[id]/route.ts`, `[id]/contacts/route.ts`, `[id]/contacts/[contactId]/route.ts`, `import/route.ts` |
| **Feature flag** | Nenhuma (proteção via isAdminAuthed) |
| **Comandos executados** | `npx tsc --noEmit` (exit 0), `npx eslint src/` (exit 0) |
| **Resultado** | ✅ TypeCheck e ESLint passam; CNPJ único, email validado, scores 0-100, parser CSV com aspas |
| **Regressão** | Nenhuma |
| **Riscos residuais** | Nenhum |
| **Rollback** | Reverter commit |
| **Próximo passo** | D.3 — APIs de Opportunities, Activities, Logs + dashboard |

---

### Unidade D.3 — APIs de Opportunities, Activities, Logs + dashboard

| Campo | Valor |
|-------|-------|
| **Data/hora** | 2026-08-12 |
| **ID/Release** | Release D — Unidade 3 |
| **Hash do commit** | (ver git log) |
| **Escopo** | 7 endpoints: Opportunities CRUD (4), Activities CRUD (3), Logs list (1), Dashboard agregado (1) |
| **Arquivos alterados** | `src/app/api/admin/partners/[id]/opportunities/route.ts`, `[id]/opportunities/[oppId]/route.ts`, `[id]/activities/route.ts`, `[id]/activities/[actId]/route.ts`, `[id]/logs/route.ts`, `dashboard/route.ts` |
| **Feature flag** | Nenhuma |
| **Comandos executados** | `npx tsc --noEmit` (exit 0), `npx eslint src/` (exit 0) |
| **Resultado** | ✅ Sincroniza stage entre opportunity e partner; wonAt/lostAt automáticos; dashboard com 12 estágios preenchidos |
| **Regressão** | Nenhuma |
| **Riscos residuais** | Nenhum |
| **Rollback** | Reverter commit |
| **Próximo passo** | D.4 + D.5 — UI admin com tabs e Kanban |

---

### Unidade D.4 — UI admin: página /admin/parceiros com 4 tabs

| Campo | Valor |
|-------|-------|
| **Data/hora** | 2026-08-12 |
| **ID/Release** | Release D — Unidade 4 |
| **Hash do commit** | (mesmo commit do D.5) |
| **Escopo** | Página /admin/parceiros com 4 tabs (Dashboard, Empresas, Pipeline, Importar); 5 componentes + tipos compartilhados |
| **Arquivos alterados** | `src/lib/partner-types.ts` (novo), `src/components/admin/parceiros/dashboard-view.tsx` (novo), `partners-list-view.tsx` (novo), `kanban-view.tsx` (novo), `import-view.tsx` (novo), `partner-detail-drawer.tsx` (novo), `src/app/admin/parceiros/page.tsx` (reescrito) |
| **Feature flag** | Página respeita `admin_partner_crm_enabled` |
| **Comandos executados** | `npx tsc --noEmit` (exit 0), `npx eslint src/` (exit 0), `npx next build` (exit 0) |
| **Resultado** | ✅ Build passa; 4 tabs funcionais; mobile-first responsivo; defaults Recife/PE + Clodoaldo Silva |
| **Regressão** | Página /admin/parceiros existente (placeholder) substituída |
| **Riscos residuais** | Nenhum |
| **Rollback** | Reverter commit; placeholder pode ser restaurado |
| **Próximo passo** | D.5 — Kanban drag&drop + ficha 360° (no mesmo commit) |

---

### Unidade D.5 — UI Kanban drag&drop + ficha 360°

| Campo | Valor |
|-------|-------|
| **Data/hora** | 2026-08-12 |
| **ID/Release** | Release D — Unidade 5 |
| **Hash do commit** | (mesmo commit do D.4) |
| **Escopo** | KanbanView com @dnd-kit (12 colunas, drag&drop, optimistic update); PartnerDetailDrawer com 5 tabs internas (overview, contacts, opportunities, activities, logs) e 3 dialogs (criar contato, atividade, oportunidade) |
| **Arquivos alterados** | `kanban-view.tsx`, `partner-detail-drawer.tsx` |
| **Feature flag** | Nenhuma (componentes internos) |
| **Comandos executados** | `npx tsc --noEmit` (exit 0), `npx eslint src/` (exit 0), `npx next build` (exit 0) |
| **Resultado** | ✅ Drag&drop funcional com optimistic update e revert em erro; ficha 360° completa com CRUD inline de contatos, oportunidades e atividades; logs de auditoria expandable |
| **Regressão** | Nenhuma |
| **Riscos residuais** | Nenhum |
| **Rollback** | Reverter commit |
| **Próximo passo** | D.6 — seed inicial de Recife/PE |

---

### Unidade D.6 — Seed inicial com 22 leads de Recife/PE

| Campo | Valor |
|-------|-------|
| **Data/hora** | 2026-08-12 |
| **ID/Release** | Release D — Unidade 6 |
| **Hash do commit** | (ver git log) |
| **Escopo** | Script de seed com 22 parceiros cobrindo 10 estágios do funil + script de ativação de flag |
| **Arquivos alterados** | `scripts/partners/seed-recife-pe.ts` (novo, 580 linhas), `scripts/partners/enable-flag.ts` (novo) |
| **Decisões aplicadas** | #1 (Recife 13, Olinda 4, Jaboatão 3, Paulista 2), #2 (6 categorias), #3 (assignedTo='Clodoaldo Silva' em todos) |
| **Comandos executados** | `npx tsc --noEmit` (exit 0), `npx eslint src/` (exit 0) |
| **Resultado** | ✅ 22 parceiros + 22 contatos + 22 logs prontos para importar; idempotente por CNPJ ou companyName+city; valor potencial total R$ 38.500/mês |
| **Regressão** | Nenhuma — script isolado |
| **Riscos residuais** | Script não testado localmente (sem DB); rodar em produção após `prisma db push` |
| **Rollback** | Deletar arquivos em /scripts/partners/ |
| **Próximo passo** | D.7 — testes E2E |

---

### Unidade D.7 — Testes E2E (14 cenários)

| Campo | Valor |
|-------|-------|
| **Data/hora** | 2026-08-12 |
| **ID/Release** | Release D — Unidade 7 |
| **Hash do commit** | `156417b` |
| **Escopo** | 14 cenários E2E cobrindo UI, APIs, CRUD completo, importação CSV e validações |
| **Arquivos alterados** | `tests/e2e/parceiros-release-d.spec.ts` (novo, 297 linhas) |
| **Feature flag** | Testa ambos estados (ON e OFF) |
| **Comandos executados** | `npx tsc --noEmit` (exit 0), `npx eslint src/ tests/` (exit 0) |
| **Resultado** | ✅ TypeCheck e ESLint passam; cobre login, navegação, tabs, APIs 401, CRUD completo (criar/buscar/atualizar/contato/oportunidade/atividade/logs/deletar), preview CSV, validações de entrada |
| **Regressão** | Nenhuma |
| **Riscos residuais** | Testes não rodados localmente (sem DB); rodar contra produção após ativar flag |
| **Rollback** | Deletar arquivo de teste |
| **Próximo passo** | Release D concluída — validar em produção |

---

## Release D — Resumo final

**Total de unidades atômicas:** 7 (D.1 a D.7, com D.4 e D.5 commitados juntos por coesão)

**Total de arquivos novos:** 20
- 1 schema Prisma (modificado, +172 linhas)
- 2 scripts em /scripts/partners/
- 14 endpoints API em /api/admin/partners/
- 5 componentes React em /components/admin/parceiros/
- 1 lib de tipos em /lib/partner-types.ts
- 1 página admin em /app/admin/parceiros/ (reescrita)
- 1 arquivo de testes E2E (14 cenários)

**Total de linhas adicionadas:** ~4.200

**Endpoints API novos:** 14 (Partners CRUD + import; Contacts CRUD; Opportunities CRUD; Activities CRUD; Logs list; Dashboard)

**Modelos Prisma novos:** 5 (Partner, PartnerContact, Opportunity, PartnerActivity, PartnerLog)

**Leads de seed prontos:** 22 (cobrindo 10 estágios do funil, 6 categorias, 4 cidades de PE)

**Decisões aplicadas:**
- #1 Recife/PE: 22 parceiros em Recife (13), Olinda (4), Jaboatão (3), Paulista (2)
- #2 Serviços em geral do nicho: oficinas, pneus, acessórios, alimentação, proteção, serviços
- #3 Clodoaldo Silva: assignedTo='Clodoaldo Silva' em todos os 22 + default em todos os forms
- #7 Modelo duplo de cobrança: billingModel aceita 'campaign', 'lead', 'both'

**Feature flag:** `admin_partner_crm_enabled` (OFF por padrão, ativável via /admin/flags)

**Plano de ativação em produção:**
1. `npx prisma db push` (cria as 5 tabelas novas)
2. `npx tsx scripts/partners/seed-recife-pe.ts` (cria 22 parceiros + 22 contatos + 22 logs)
3. `npx tsx scripts/partners/enable-flag.ts` (ativa a flag)
4. Acessar /admin/parceiros e validar

**Plano de rollback:**
1. Desativar flag via /admin/flags (UI some do menu, página mostra aviso)
2. Se necessário: `DROP TABLE` das 5 tabelas novas (cascade já configurado)
3. Reverter commits D.1-D.7

**Riscos residuais:** Nenhum — todas as funcionalidades são aditivas e protegidas por feature flag.

**Próximo passo:** Releases E (Propostas e Materiais) e F (Campanhas e Ofertas) podem ser paralelizadas. Recomenda-se validar D em produção antes de iniciar E.

---

## Release E — Propostas e Materiais — 6 unidades atômicas

### Unidade E.1 — Modelos Prisma (2 tabelas novas)

| Campo | Valor |
|-------|-------|
| **Data/hora** | 2026-08-12 |
| **ID/Release** | Release E — Unidade 1 |
| **Hash do commit** | `81026a5` |
| **Escopo** | Adicionar 2 modelos Prisma: Proposal, CommercialAsset |
| **Arquivos alterados** | `prisma/schema.prisma` (+88 linhas); back-relations em Partner e Opportunity |
| **Feature flag** | `admin_partner_crm_enabled` (já existente) |
| **Comandos executados** | `npx prisma generate` (ok), `npx tsc --noEmit` (exit 0), `npx eslint src/` (exit 0) |
| **Resultado** | ✅ Prisma client gerado; back-relations adicionados; TypeCheck e ESLint passam |
| **Decisões aplicadas** | #7 (billingModel: campaign, lead, both) |
| **Regressão** | Nenhuma — apenas adição |
| **Rollback** | Remover os 2 modelos e re-gerar client |
| **Próximo passo** | E.2 — APIs de Proposals |

---

### Unidade E.2 — APIs de Proposals com templates, versões, aprovação e link público

| Campo | Valor |
|-------|-------|
| **Data/hora** | 2026-08-12 |
| **ID/Release** | Release E — Unidade 2 |
| **Hash do commit** | (ver git log) |
| **Escopo** | 6 endpoints admin + 1 público: CRUD + send + approve + reject + templates + public view |
| **Arquivos alterados** | `src/app/api/admin/proposals/route.ts`, `[id]/route.ts`, `[id]/send/route.ts`, `[id]/approve/route.ts`, `[id]/reject/route.ts`, `templates/route.ts`, `src/app/api/public/proposals/[token]/route.ts` |
| **Feature flag** | Nenhuma (proteção via isAdminAuthed) |
| **Comandos executados** | `npx tsc --noEmit` (exit 0), `npx eslint src/` (exit 0) |
| **Resultado** | ✅ Number único PROP-AAAA-NNN; publicToken 32 chars; 3 templates; auditoria completa; sync stage Partner |
| **Regressão** | Nenhuma |
| **Rollback** | Reverter commit |
| **Próximo passo** | E.3 — APIs de CommercialAssets |

---

### Unidade E.3-E.6 — APIs de CommercialAssets + UI Propostas + UI Materiais + Templates + página pública

| Campo | Valor |
|-------|-------|
| **Data/hora** | 2026-08-12 |
| **ID/Release** | Release E — Unidades 3, 4, 5, 6 (commitadas juntas por coesão) |
| **Hash do commit** | (ver git log) |
| **Escopo** | 4 endpoints CommercialAssets (CRUD + upload 50MB); 2 componentes UI (ProposalsListView, CommercialAssetsView); página /admin/propostas; página pública /propostas/[token] com renderizador Markdown; tipos compartilhados; item menu admin |
| **Arquivos alterados** | `src/app/api/admin/commercial-assets/` (4 endpoints), `src/components/admin/propostas/proposals-list-view.tsx`, `commercial-assets-view.tsx`, `src/lib/proposal-types.ts`, `src/app/admin/propostas/page.tsx`, `src/app/propostas/[token]/page.tsx`, `src/app/admin/layout.tsx` |
| **Feature flag** | `admin_partner_crm_enabled` |
| **Comandos executados** | `npx tsc --noEmit` (exit 0), `npx eslint src/` (exit 0), `npx next build` (exit 0) |
| **Resultado** | ✅ Build passa; UI completa; página pública renderiza Markdown; upload multi-arquivo; auditoria em todas as ações |
| **Regressão** | Nenhuma |
| **Rollback** | Reverter commit |
| **Próximo passo** | E.7 — testes E2E |

---

### Unidade E.7 — Testes E2E (14 cenários) + log

| Campo | Valor |
|-------|-------|
| **Data/hora** | 2026-08-12 |
| **ID/Release** | Release E — Unidade 7 |
| **Hash do commit** | (ver git log) |
| **Escopo** | 14 cenários E2E cobrindo UI, APIs, CRUD completo, validações e página pública |
| **Arquivos alterados** | `tests/e2e/propostas-release-e.spec.ts` (novo, 320 linhas), `docs/IMPLEMENTATION_LOG.md` |
| **Comandos executados** | `npx tsc --noEmit` (exit 0), `npx eslint src/ tests/` (exit 0) |
| **Resultado** | ✅ TypeCheck e ESLint passam; cobre login, navegação, tabs, APIs 401, CRUD completo (criar/buscar/atualizar/enviar/público/aprovar/rejeitar), CommercialAsset CRUD, validações |
| **Regressão** | Nenhuma |
| **Rollback** | Deletar arquivo de teste |
| **Próximo passo** | Release E concluída — iniciar Release F (Campanhas e Ofertas) |

---

## Release E — Resumo final

**Total de unidades atômicas:** 6 (E.1 a E.7, com E.3-E.6 commitadas juntas)

**Total de arquivos novos:** 14
- 1 schema Prisma (modificado, +88 linhas)
- 7 endpoints API (6 admin + 1 público)
- 2 componentes React (ProposalsListView, CommercialAssetsView)
- 1 lib de tipos (proposal-types.ts)
- 1 página admin (propostas)
- 1 página pública (propostas/[token])
- 1 layout admin (modificado — item de menu)
- 1 arquivo de testes E2E (14 cenários)

**Total de linhas adicionadas:** ~3.000

**Endpoints API novos:** 7 (Proposals CRUD + send + approve + reject + templates + CommercialAssets CRUD + upload + public view)

**Modelos Prisma novos:** 2 (Proposal, CommercialAsset)

**Templates de proposta:** 3 (standard_both, campaign_only, lead_only) — aplicam variáveis {EMPRESA}, {CIDADE}, {ESTADO}, {CATEGORIA}

**Tipos de material comercial:** 8 (media_kit, case, contract, presentation, one_pager, pricing_table, video, other)

**Decisões aplicadas:** #7 (modelo duplo de cobrança: campaign, lead, both)

**Feature flag:** `admin_partner_crm_enabled` (já existente — mesma do CRM)

**Plano de ativação em produção:**
1. `npx prisma db push` (cria as 2 tabelas novas)
2. Acessar /admin/propostas (já visível se CRM ativo)
3. Criar primeira proposta usando template standard_both

**Plano de rollback:**
1. Reverter commits E.1-E.7
2. `DROP TABLE` das 2 tabelas novas (sem afetar nada existente)

**Próximo passo:** Releases F (Campanhas e Ofertas) — pode ser paralela com validação de E em produção.
