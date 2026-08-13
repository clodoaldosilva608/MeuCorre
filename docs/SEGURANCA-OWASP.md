# Guia de Segurança OWASP — MeuCorre

> Educação em segurança web para a equipe de desenvolvimento
> Baseado no OWASP Top 10 (2021) e OWASP API Security Top 10

---

## OWASP Top 10 — Aplicado ao MeuCorre

### A01:2021 — Broken Access Control (Controle de Acesso Quebrado)

**O que é**: Usuário acessa recursos que não deveria (dados de outros usuários, áreas admin).

**Como o MeuCorre protege**:
- `isAdminAuthed()` em TODOS os endpoints admin (104 arquivos)
- `getUserSession()` em todos os endpoints do app
- IDOR: endpoints com ID validam `resource.userId === session.sub`
- Feature flags verificadas no servidor (não no frontend)
- RLS habilitado no Supabase (41 tabelas)

**O que observar ao codar**:
```typescript
// ❌ ERRADO — não checa dono
app.get('/api/orders/:id', (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  res.json(order); // qualquer um pode ver qualquer pedido!
});

// ✅ CERTO — checa dono
app.get('/api/orders/:id', (req, res) => {
  const session = await getUserSession();
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (order.userId !== session.sub) return res.status(403).json({ error: "Proibido" });
  res.json(order);
});
```

---

### A02:2021 — Cryptographic Failures (Falhas Criptográficas)

**O que é**: Senhas fracas, dados sensíveis sem criptografia, algoritmos desatualizados.

**Como o MeuCorre protege**:
- Senhas: `bcrypt` com 10 rounds (≈100ms por hash)
- JWT: `jose` com HS256, chaves separadas (ADMIN_JWT_SECRET ≠ USER_JWT_SECRET)
- HTTPS: obrigatório via Vercel + HSTS (max-age=63072000)
- Cookies: `httpOnly: true, secure: true, sameSite: "lax"`
- Reset tokens: expiram em 1 hora

**O que observar**:
- NUNCA usar MD5, SHA-1 para senhas
- NUNCA usar `Math.random()` para tokens de segurança — usar `crypto.randomBytes()`
- NUNCA logar senhas, tokens ou dados sensíveis

---

### A03:2021 — Injection (Injeção)

**O que é**: SQL injection, NoSQL injection, command injection, LDAP injection.

**Como o MeuCorre protege**:
- Prisma ORM usa **prepared statements** automaticamente (SQL injection mitigado)
- `sanitizeString()` limita tamanho e remove caracteres perigosos
- `validateBody()` valida tipo, required, max, enum
- `validateId()` valida formato CUID antes de usar em queries

**O que observar**:
```typescript
// ❌ ERRADO — concatenação de string
const query = `SELECT * FROM users WHERE email = '${userInput}'`;

// ✅ CERTO — Prisma parametriza automaticamente
const user = await prisma.user.findUnique({ where: { email: userInput } });
```

---

### A04:2021 — Insecure Design (Design Inseguro)

**O que é**: Falta de modelagem de ameaças, ausência de limites de taxa, fluxos sem validação.

**Como o MeuCorre protege**:
- Rate limiting em endpoints sensíveis (login, quiz, tracking, sync)
- Outbound supervisionado: dry-run obrigatório, aprovação humana, NENHUM envio automático
- Opt-out permanente em outbound (LGPD)
- Workflow de aprovação em campanhas (draft → approved → published)

**O que observar**:
- Sempre pensar "e se alguém tentar abusar deste endpoint?"
- Adicionar rate limiting em qualquer endpoint público novo
- Validar estado (não permitir pular etapas do workflow)

---

### A05:2021 — Security Misconfiguration (Configuração Incorreta)

**O que é**: Debug em produção, headers ausentes, credenciais padrão, CORS aberto.

**Como o MeuCorre protege**:
- `NODE_ENV=production` na Vercel
- CSP configurada: `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'self'`
- Headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`
- `.env` no `.gitignore` (antes do primeiro commit)
- Console.logs sensíveis removidos

**O que observar**:
- Remover TODOS `console.log` que expõem dados sensíveis antes de commit
- Verificar se `NODE_ENV` é `production` em deploy
- Nunca usar credenciais padrão (admin/admin, senha123)

---

### A06:2021 — Vulnerable and Outdated Components (Componentes Vulneráveis)

**O que é**: Dependências npm com CVEs conhecidos.

**Como o MeuCorre protege**:
- `npm audit` no GitHub Actions (a cada push/PR)
- Gitleaks no CI (caça segredos no código)
- Snyk no CI (se SNYK_TOKEN configurado)
- `next-auth` removido (tinha CVE crítico e não era usado)
- `package-lock.json` versionado (lockfile garante versões reproduzíveis)

**O que observar**:
- Rodar `npm audit` antes de cada deploy
- Atualizar dependências mensalmente (`npm outdated`)
- Remover dependências não utilizadas

---

### A07:2021 — Identification and Authentication Failures (Falhas de Autenticação)

**O que é**: Brute force, sessões sem expiração, senhas fracas.

**Como o MeuCorre protege**:
- Rate limiting no login admin: 5 tentativas / 15 min por IP
- Rate limiting no quiz: 3 cadastros / hora por IP
- JWT com expiração: 7 dias (admin), 30 dias (user)
- Cookies `httpOnly` (não acessíveis via JavaScript)
- Logout invalida cookie

**O que observar**:
- Validar força de senha no registro (mínimo 8 chars, 1 número, 1 maiúscula)
- Implementar 2FA para admin (futuro)
- Monitorar tentativas de login falhas

---

### A08:2021 — Software and Data Integrity Failures (Falhas de Integridade)

**O que é**: Código não verificado, dependências sem assinatura, CI/CD sem validação.

**Como o MeuCorre protege**:
- GitHub Actions valida TypeCheck + ESLint + npm audit + Gitleaks
- `package-lock.json` garante versões reproduzíveis
- Commits assinados com GPG (recomendado configurar)

**O que observar**:
- Revisar `package-lock.json` após `npm install`
- Não usar `npm install --force` em produção
- Verificar integridade de downloads externos

---

### A09:2021 — Security Logging and Monitoring Failures (Falhas de Log)

**O que é**: Sem logs de auditoria, sem alertas, sem monitoramento.

**Como o MeuCorre protege**:
- `PartnerLog`: registra todas as ações no CRM (created, updated, stage_changed, opt_out, etc)
- `AdminAction`: registra ações administrativas
- `OutboundLog`: registra todo outbound supervisionado
- Sentry: error tracking em produção
- Todos os logs incluem: `adminEmail`, `ipAddress`, `timestamp`

**O que observar**:
- Sempre logar ações sensíveis (criar, editar, deletar, aprovar)
- NUNCA logar dados sensíveis (senhas, tokens, dados pessoais)
- Monitorar alertas do Sentry diariamente

---

### A10:2021 — Server-Side Request Forgery (SSRF)

**O que é**: Servidor faz requisições para URLs controladas pelo atacante.

**Como o MeuCorre protege**:
- `validateImageUrl()` bloqueia IPs locais (127.0.0.1, 10.x, 192.168.x, 169.254.169.254)
- `validateExternalUrl()` valida protocolo (só HTTPS)
- Não há endpoints que aceitam URL arbitrária para fetch server-side

**O que observar**:
- Validar TODA URL externa antes de fazer fetch no servidor
- Bloquear metadata cloud (169.254.169.254 — AWS/GCP)
- Bloquear IPs privados (10.x, 192.168.x, 172.16-31.x)

---

## OWASP API Security Top 10

### API1 — BOLA (Broken Object Level Authorization) = IDOR
Já coberto acima (A01). Toda API com `:id` valida o dono.

### API2 — Broken User Authentication
Rate limiting + JWT com expiração + cookies httpOnly.

### API3 — Excessive Data Exposure
APIs retornam apenas campos necessários. `select:` no Prisma limita campos.

### API4 — Lack of Resources & Rate Limiting
Rate limiting em todos os endpoints públicos (login, quiz, tracking, sync, convert).

### API5 — Broken Function Level Authorization
`isAdminAuthed()` em todos os endpoints admin. Feature flags verificadas no servidor.

### API6 — Mass Assignment
Prisma `create()` / `update()` usam `data:` com campos explícitos (não spread de body inteiro).

### API7 — Security Misconfiguration
CSP, HSTS, X-Frame-Options, nosniff. `.env` no `.gitignore`.

### API8 — Improper Assets Management
Documentação de todas as APIs em `docs/IMPLEMENTATION_LOG.md`. Feature flags controlam acesso.

### API9 — Insufficient Logging
PartnerLog, AdminAction, OutboundLog, Sentry. Todos com adminEmail + ipAddress.

### API10 — Unsafe Consumption of APIs
Validação de webhooks (Kiwify webhook valida assinatura). URLs externas validadas.

---

## Checklist de Segurança para Novos Endpoints

Ao criar um novo endpoint API, verificar:

- [ ] Tem `isAdminAuthed()` ou `getUserSession()`?
- [ ] Se recebe `:id`, valida que o recurso pertence ao usuário?
- [ ] Input validado com `sanitizeString()` ou `validateBody()`?
- [ ] Se é endpoint público, tem rate limiting?
- [ ] Não expõe dados sensíveis no response (select apenas campos necessários)?
- [ ] Não faz `console.log` de dados sensíveis?
- [ ] Se aceita upload, valida MIME type?
- [ ] Se aceita URL externa, valida contra SSRF?
- [ ] Ação é logada (PartnerLog / AdminAction / OutboundLog)?
- [ ] Não há secrets hardcoded no código?

---

## LGPD — Lei Geral de Proteção de Dados

### Princípios aplicados no MeuCorre:

| Princípio | Aplicação |
|-----------|-----------|
| Finalidade | Dados coletados com propósito claro (registro, pagamento, CRM) |
| Minimização | Só coleta o necessário (email, phone, name — não CPF, não RG) |
| Consentimento | Opt-in para prospecção (quiz), opt-out permanente em outbound |
| Transparência | Política de privacidade em `/privacidade`, termos em `/termos` |
| Segurança | bcrypt, JWT, HTTPS, RLS, CSP, rate limiting |
| Não discriminação | Dados não usados para penalizar trabalhadores |
| Responsabilização | Logs de auditoria em todas as ações sensíveis |

### Direitos do titular:

| Direito | Como exercer |
|---------|-------------|
| Acesso | Email para contato@meucorre.com.br |
| Retificação | Editar perfil no app |
| Eliminação | Delete cascade no banco (User → Synced* → PartnerLog) |
| Portabilidade | Exportação CSV via /admin/metricas/reports |
| Oposição | Opt-out permanente em outbound |

---

## Ferramentas de Segurança Integradas

| Ferramenta | O que faz | Quando roda |
|------------|-----------|-------------|
| **npm audit** | Vulnerabilidades em dependências | A cada push/PR (GitHub Actions) |
| **Gitleaks** | Segredos no código e histórico Git | A cada push/PR (GitHub Actions) |
| **Snyk** | Scanner avançado de vulnerabilidades | A cada push/PR (se SNYK_TOKEN configurado) |
| **ESLint** | Padrões de código e anti-patterns | A cada push/PR + local |
| **TypeScript strict** | Type safety previne bugs | A cada push/PR + local |
| **Sentry** | Error tracking em produção | Tempo real |
| **RLS Supabase** | Proteção no nível do banco | Sempre ativo |

---

## Como Reportar Vulnerabilidades

1. **NÃO** abra issue pública no GitHub
2. Envie email para: **contato@meucorre.com.br**
3. Inclua: descrição, passos para reproduzir, impacto, sugestão de correção
4. **Tempo de resposta**: 48 horas
5. **Tempo de correção**: 7 dias (crítico), 30 dias (alto)
