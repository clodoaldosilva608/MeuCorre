# Estratégia de Releases e Proteção de Deploy — MeuCorre

Este documento descreve como o MeuCorre organiza versões no GitHub e protege o deploy em produção.

## 🎯 Objetivo

Garantir que **só faça deploy para produção código que está funcionando**.
Qualquer versão anterior pode ser recuperada (rollback) via tag do Git.

---

## 📋 Branch Protection Rules (configurar uma única vez)

Acesse: **GitHub → clodoaldosilva608/MeuCorre → Settings → Branches → Add rule**

| Configuração | Valor |
|--------------|-------|
| Branch name pattern | `main` |
| ✅ Require a pull request before merging | ON |
| ✅ Require approvals | 1 (você mesmo, em outro dia) |
| ✅ Require status checks to pass | ON |
| ✅ Require branches to be up to date | ON |
| Status checks required | `Security + Build` |
| ✅ Require conversation resolution | ON |
| ✅ Do not allow bypassing the above settings | ON |

**Resultado:** nunca mais vai conseguir fazer `git push` direto em `main`.
Toda mudança tem que passar por Pull Request + CI passing.

---

## 🚀 Workflow de deploy (a partir de agora)

### 1. Desenvolvimento (dia a dia)
```bash
git checkout -b feat/minha-feature
# ... faz mudanças ...
git commit -m "feat: minha feature"
git push origin feat/minha-feature
# Abre PR no GitHub → CI roda → se passar, pode fazer merge
```

### 2. Deploy para produção (release)
```bash
# Marca a versão
git tag -a v1.0.0 -m "Release v1.0.0 - login admin + user funcionando"

# Push da tag (dispara release no GitHub)
git push origin v1.0.0
```

A tag dispara o workflow que cria uma **GitHub Release** automática com changelog.

### 3. Rollback (se algo quebrar)
```bash
# Ver todas as releases
git tag -l

# Voltar para uma versão anterior
git checkout v0.9.0
# Ou criar um novo deploy da versão antiga
git tag -a v1.0.1 -m "Hotfix - rollback para v0.9.0 + fix"
git push origin v1.0.1
```

---

## 📦 Versionamento Semântico

Formato: `vMAJOR.MINOR.PATCH`

| Tipo | Quando usar | Exemplo |
|------|-------------|---------|
| **MAJOR** | Quebra de compatibilidade | `v2.0.0` (mudou schema do banco) |
| **MINOR** | Nova feature compatível | `v1.1.0` (nova aba no admin) |
| **PATCH** | Bug fix | `v1.0.1` (corrigiu login) |
| **RC** | Release candidate | `v1.1.0-rc.1` (pré-release) |
| **BETA** | Beta test | `v1.1.0-beta.1` |

---

## ✅ Checklist antes de criar uma release

- [ ] `npx tsc --noEmit` passa sem erros
- [ ] `npx next build` passa
- [ ] `gitleaks detect --source .` não encontra segredos novos
- [ ] Testado login admin no navegador
- [ ] Testado login usuário no navegador
- [ ] Console do navegador sem erros vermelhos
- [ ] RLS habilitado no Supabase (`scripts/supabase-enable-rls.sql` rodado)
- [ ] Env vars da Vercel atualizadas (se necessário)
- [ ] CHANGELOG atualizado (gerado automaticamente pela Release)
- [ ] Tag criada com versão semântica
- [ ] Release notes revisadas no GitHub

---

## 🛡️ CI Pipeline (já configurado)

Arquivo: `.github/workflows/ci.yml`

Roda automaticamente em todo push para `main` e em Pull Requests:

1. **Gitleaks** — caça segredos vazados (falha build se encontrar)
2. **TypeScript check** — valida tipos
3. **Prisma generate** — valida schema
4. **Next.js build** — valida que builda
5. **Smoke test** — verifica artefatos

Se algum passo falhar, o PR não pode ser mergeado.

---

## 🔒 Vercel — Ignored Build Step (opcional, recomendado)

Para que a Vercel só faça deploy quando o CI passar:

**Vercel → clodoaldosilva608/MeuCorre → Settings → Git → Ignored Build Step**

```bash
#!/bin/bash
# Só faz deploy se o último workflow do GitHub Actions passou
curl -sf "https://api.github.com/repos/clodoaldosilva608/MeuCorre/actions/runs?branch=$VERCEL_GIT_COMMIT_REF&per_page=1" | \
  jq -r '.workflow_runs[0].conclusion' | grep -q "success"
```

Isso evita deploy de código que falhou no CI.

---

## 🗂️ Histórico de versões

| Tag | Data | Status | Descrição |
|-----|------|--------|-----------|
| `v1.0.0` | 2026-08-16 | ✅ Stable | Login admin + user funcionando, Prisma + Postgres, CSP correto |
| `138a028` | 2026-08-16 | 🟡 Pre-release | Última versão com sqlite (backup) |

### Como recuperar uma versão antiga

```bash
# 1. Ver todas as tags
git tag -l

# 2. Ver detalhes de uma release
gh release view v1.0.0

# 3. Baixar código de uma versão
git checkout v1.0.0

# 4. Criar nova release a partir de uma antiga (rollback)
git checkout v1.0.0
git checkout -b rollback/v0.9.0
git push origin rollback/v0.9.0
# Abre PR → merge → cria nova tag
```

---

## 📊 Status atual (2026-08-16)

- ✅ Aplicação online em `https://meucorre.vercel.app`
- ✅ Login admin funcionando (via env vars + fallback Prisma)
- ✅ Login usuário funcionando (Prisma + Supabase)
- ✅ Todas as 17 páginas admin acessíveis sem erros
- ✅ Console do navegador limpo
- ✅ CSP permite AdSense
- ✅ Auth em todas as rotas admin
- ⚠️ RLS não habilitado no Supabase (rodar `scripts/supabase-enable-rls.sql`)
- ⚠️ 27 scripts de teste com senha hardcoded (precisa limpar histórico)
- ⚠️ IDOR corrigido em `/api/subscription/[id]/receipt` (commit pendente)

### Próximos passos recomendados

1. **Rodar** `scripts/supabase-enable-rls.sql` no Supabase SQL Editor
2. **Configurar** Branch Protection Rules no GitHub
3. **Configurar** Vercel Ignored Build Step
4. **Limpar** scripts de teste com senha hardcoded
5. **Criar** tag `v1.0.0` para primeira release estável
