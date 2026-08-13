# Security Policy

## Reporting a Vulnerability

Se você encontrou uma vulnerabilidade de segurança, NÃO abra uma issue pública.

Envie um email para: **contato@meucorre.com.br** com:
- Descrição da vulnerabilidade
- Passos para reproduzir
- Impacto estimado
- Sugestão de correção (se houver)

**Tempo de resposta**: 48 horas
**Tempo de correção**: 7 dias para crítico, 30 dias para alto

## Security Measures

### Authentication
- JWT httpOnly cookies (admin + user separados)
- bcrypt 10 rounds para senhas
- Rate limiting: 5 tentativas de login / 15 min por IP
- JWT expiry: 7 dias (admin), 30 dias (user)

### Authorization
- `isAdminAuthed()` em todos os endpoints admin
- `getUserSession()` em todos os endpoints do app
- Validação de dono (IDOR) em endpoints com ID: `resource.userId === session.sub`
- Feature flags controlam acesso a módulos

### Data Protection
- HTTPS obrigatório (Vercel + HSTS)
- CSP configurada (X-Frame-Options: DENY, nosniff)
- Secrets em env vars (nunca no código)
- `.env` no `.gitignore`
- RLS (Row Level Security) habilitado no Supabase
- `service_role` key NUNCA exposta no frontend

### Input Validation
- `sanitizeString()` em todos os inputs de texto
- `validateBody()` com schema para endpoints críticos
- `validateId()` para parâmetros de URL (CUID format)
- Validação de MIME type em uploads
- Rate limiting em endpoints públicos

### Audit Trail
- `PartnerLog` registra todas as ações no CRM
- `AdminAction` registra ações administrativas
- `OutboundLog` registra todo outbound supervisionado
- Todos os logs incluem: adminEmail, ipAddress, timestamp

### LGPD Compliance
- Opt-out permanente em outbound
- Direito de ser esquecido (delete cascade)
- Dados pessoais minimizados (só o necessário)
- Transparência: logs de acesso a dados sensíveis
