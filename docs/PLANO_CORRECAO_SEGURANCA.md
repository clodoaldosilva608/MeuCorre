# Plano de Correção de Segurança — MeuCorre

> Baseado na análise do vídeo "🚨 USOU VIBECODING? TÁ CORRENDO RISCO" e auditoria do código
> Data: 13/08/2026
> Status: **PLANO DE AÇÃO IMEDIATA**

---

## Contexto

O vídeo alerta sobre riscos de segurança em aplicações desenvolvidas com IA (vibecoding). Aplicações geradas por IA frequentemente têm vulnerabilidades porque a IA prioriza funcionalidade sobre segurança. As principais preocupações incluem:

1. **Secrets hardcoded** no código-fonte
2. **Endpoints sem autenticação** expondo dados sensíveis
3. **Falta de validação de input** (injection attacks)
4. **Console.logs** vazando dados sensíveis em produção
5. **Falta de rate limiting** em endpoints críticos
6. **Senhas e tokens** em texto plano ou com hash fraco
7. **CORS mal configurado**
8. **Falta de headers de segurança** (CSP, HSTS, etc)
9. **Dependências vulneráveis** não atualizadas
10. **LGPD**: dados pessoais sem proteção adequada

---

## Auditoria do MeuCorre — Vulnerabilidades Encontradas

### 🔴 CRÍTICO (corrigir imediatamente)

#### V1. Reset link exposto em console.log
**Arquivo**: `src/app/api/auth/forgot-password/route.ts:71`
```typescript
console.log(`[forgot-password] Reset link para ${email}: ${resetLink}`);
```
**Risco**: Qualquer pessoa com acesso aos logs da Vercel pode ver links de reset de senha de qualquer usuário.
**Correção**: Remover o console.log completamente ou substituir por log sem o link.

#### V2. Senha de admin em texto plano no código de teste
**Arquivo**: `tests/e2e/helpers.ts`
```typescript
admin: { email: "clodoaldo608@gmail.com", password: "Silva88677488@#" }
```
**Risco**: Credencial real de produção commitada no Git.
**Correção**: Usar variável de ambiente `E2E_ADMIN_PASSWORD` ou conta de teste separada.

#### V3. Endpoints públicos sem rate limiting
**Arquivos**:
- `src/app/api/quiz/submit/route.ts` — captura de leads sem rate limit
- `src/app/api/quiz/convert/route.ts` — criação de conta sem rate limit
- `src/app/api/admin/login/route.ts` — login sem rate limit (brute force)
- `src/app/api/public/campaigns/[id]/track/route.ts` — tracking sem rate limit

**Risco**: Brute force de senhas, spam de criação de contas, inflar métricas.
**Correção**: Aplicar `applyRateLimit()` em todos os endpoints públicos.

### 🟡 ALTO (corrigir nesta sprint)

#### V4. Falta de validação de input em 89 endpoints
**Risco**: SQL injection (via Prisma é mitigado), NoSQL injection, XSS, command injection.
**Correção**: Adicionar validação com Zod em todos os endpoints que recebem body/params.

#### V5. Console.logs em produção
**Arquivos**: 6 arquivos com console.log/error em endpoints de API
**Risco**: Vazamento de dados sensíveis (emails, errors com stack traces) nos logs.
**Correção**: Remover todos console.logs de produção ou usar níveis de log controlados.

#### V6. Endpoint `/api/subscription` sem auth
**Arquivo**: `src/app/api/subscription/route.ts`
**Risco**: Qualquer pessoa pode criar assinaturas e potencialmente acessar dados de outras.
**Correção**: Adicionar autenticação ou validar origin/origin check.

#### V7. Falta de CSP (Content Security Policy) robusta
**Arquivo**: `next.config.ts`
**Risco**: XSS attacks podem injetar scripts maliciosos.
**Correção**: Revisar e fortalecer a CSP — atual permite `unsafe-eval` e `unsafe-inline`.

#### V8. Dependências potencialmente vulneráveis
**Risco**: Pacotes npm desatualizados podem ter vulnerabilidades conhecidas.
**Correção**: Rodar `npm audit` e atualizar pacotes com vulnerabilidades.

### 🟢 MÉDIO (corrigir próximo sprint)

#### V9. Falta de HTTPS redirect explícito
**Risco**: Em ambientes não-Vercel, HTTP poderia ser usado.
**Correção**: Adicionar middleware de redirect HTTPS.

#### V10. Cookies sem SameSite em alguns endpoints
**Risco**: CSRF attacks.
**Correção**: Garantir que todos os cookies tenham `sameSite: "lax"` ou `"strict"`.

#### V11. Falta de sanitização XSS em conteúdo Markdown
**Arquivo**: `src/app/propostas/[token]/page.tsx` — renderiza Markdown de propostas
**Risco**: XSS se o admin inserir scripts maliciosos no corpo da proposta.
**Correção**: Sanitizar HTML antes de renderizar.

#### V12. Falta de log de auditoria para ações sensíveis
**Risco**: Impossível rastrear quem fez o quê em caso de incidente.
**Correção**: Garantir que todas as ações de admin sejam logadas em `AdminAction` ou `PartnerLog`.

### 🔵 BAIXO (backlog)

#### V13. Falta de timeout em queries do Prisma
**Risco**: Queries lentas podem derrubar o servidor.
**Correção**: Adicionar timeout global no Prisma client.

#### V14. Falta de criptografia em repouso para dados sensíveis
**Risco**: Se o Supabase for comprometido, dados pessoais ficam expostos.
**Correção**: Criptografar campos sensíveis (phone, email) no nível da aplicação.

#### V15. Falta de política de senhas fortes
**Risco**: Usuários podem usar senhas fracas.
**Correção**: Adicionar validação de força de senha no registro.

---

## Plano de Ação

### Fase 1 — Correções Críticas (hoje)

| ID | Vulnerabilidade | Ação | Arquivo |
|----|-----------------|------|---------|
| V1 | Reset link em log | Remover console.log do reset link | `api/auth/forgot-password/route.ts` |
| V2 | Senha no Git | Substituir por env var | `tests/e2e/helpers.ts` |
| V3 | Rate limiting | Aplicar applyRateLimit em 4 endpoints | `api/quiz/submit`, `api/quiz/convert`, `api/admin/login`, `api/public/campaigns/[id]/track` |
| V5 | Console.logs | Remover todos console.logs de API routes | 6 arquivos |

### Fase 2 — Validação e Headers (2 dias)

| ID | Vulnerabilidade | Ação |
|----|-----------------|------|
| V4 | Validação de input | Adicionar validação Zod nos 89 endpoints |
| V6 | Endpoint sem auth | Adicionar auth em `/api/subscription` |
| V7 | CSP | Fortalecer Content Security Policy |
| V8 | Dependências | Rodar `npm audit` + atualizar |
| V10 | Cookies SameSite | Verificar e corrigir todos os cookies |
| V11 | XSS em Markdown | Sanitizar HTML em propostas públicas |

### Fase 3 — Melhorias (1 semana)

| ID | Vulnerabilidade | Ação |
|----|-----------------|------|
| V9 | HTTPS redirect | Adicionar middleware |
| V12 | Log de auditoria | Garantir AdminAction em todas as ações |
| V13 | Timeout Prisma | Configurar globalmente |
| V15 | Política de senhas | Adicionar validação no registro |

---

## Checklist de Segurança Pós-Correção

- [ ] Nenhum secret/credencial no código-fonte
- [ ] Nenhum console.log de dados sensível em produção
- [ ] Todos os endpoints sensíveis têm autenticação
- [ ] Todos os endpoints públicos têm rate limiting
- [ ] CSP configurada sem unsafe-eval
- [ ] Dependências auditadas (npm audit = 0 vulnerabilities)
- [ ] Cookies com httpOnly + secure + sameSite
- [ ] Validação de input em todos os endpoints
- [ ] HTTPS redirect ativo
- [ ] Log de auditoria em todas as ações de admin
- [ ] Senhas com hash bcrypt (10+ rounds)
- [ ] JWT com expiração configurada
- [ ] LGPD: dados pessoais com proteção adequada
