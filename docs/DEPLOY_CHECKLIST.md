# Deploy Checklist — MeuCorre 100k Usuários

## Status do Deploy (validado em 2026-08-21)
- **Versão:** `b7f2e1b`
- **Health:** `healthy` — database OK, Redis OK, Sentry OK
- **URL:** https://meucorre.vercel.app

---

## ✅ Já Configurado (Confirmado via /api/health)

| Item | Status |
|------|--------|
| DATABASE_URL (Supabase) | ✅ OK |
| DIRECT_URL (Supabase) | ✅ OK |
| UPSTASH_REDIS_REST_URL | ✅ OK |
| UPSTASH_REDIS_REST_TOKEN | ✅ OK |
| SENTRY_DSN | ✅ OK |
| RESEND_API_KEY | ✅ OK |
| KIWIFY_WEBHOOK_SECRET | ✅ OK |
| KIWIFY_CLIENT_ID | ✅ OK |
| KIWIFY_CLIENT_SECRET | ✅ OK |
| KIWIFY_ACCOUNT_ID | ✅ OK |
| USER_JWT_SECRET | ✅ OK |
| ADMIN_JWT_SECRET | ✅ OK |
| ADMIN_EMAIL | ✅ OK |
| ADMIN_PASSWORD | ✅ OK |
| CRON_SECRET | ✅ OK |
| NEXT_PUBLIC_APP_URL | ✅ OK |
| vercel.json regions: ["gru1"] | ✅ OK |

---

## ❌ Pendente de Configuração (Opcional mas Recomendado)

### 1. QStash (Upstash) — Fila assíncrona
**Prioridade:** Média (fallback síncrono funciona)
**Benefício:** Webhook Kiwify e email não bloqueiam response

**Passos:**
1. Acesse https://console.upstash.com → QStash
2. Crie QStash (free: 500 msgs/dia)
3. Copie `QSTASH_TOKEN`
4. Vercel → Settings → Environment Variables:
   ```
   QSTASH_TOKEN=<seu_token>
   ```
5. Redeploy

---

### 2. Backup S3 (AWS ou Cloudflare R2)
**Prioridade:** Alta (sem backup real atualmente)
**Benefício:** Backup automático diário das tabelas críticas

**Passos AWS S3:**
1. Crie bucket S3: `meucorre-backups`
2. Crie IAM user com permissão `s3:PutObject`
3. Vercel → Settings → Environment Variables:
   ```
   BACKUP_S3_BUCKET=meucorre-backups
   BACKUP_S3_REGION=sa-east-1
   BACKUP_S3_ACCESS_KEY=<access_key>
   BACKUP_S3_SECRET_KEY=<secret_key>
   ```

**OU Cloudflare R2 (mais barato):**
1. Cloudflare → R2 → Create bucket: `meucorre-backups`
2. Create API Token com permissão de escrita
3. Vercel env vars:
   ```
   BACKUP_S3_BUCKET=meucorre-backups
   BACKUP_S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
   BACKUP_S3_ACCESS_KEY=<access_key>
   BACKUP_S3_SECRET_KEY=<secret_key>
   ```

---

### 3. Vercel Edge Config (Feature Flags)
**Prioridade:** Baixa (DB fallback funciona)
**Benefício:** Feature flags em <5ms (edge global)

**Passos:**
1. Vercel Dashboard → Storage → Edge Config → Create
2. Nome: `meucorre-flags`
3. Vercel → Settings → Environment Variables:
   ```
   EDGE_CONFIG=<edge_config_id>
   EDGE_CONFIG_ACCESS_TOKEN=<token>
   ```

---

### 4. Cloudflare CDN
**Prioridade:** Baixa (Vercel Edge já funciona)
**Benefício:** 320+ POPs, WAF, DDoS protection, Polish

**Passos:**
1. Crie conta Cloudflare (free)
2. Add domain `meucorre.com.br`
3. Mude nameservers para Cloudflare
4. Page Rules:
   - `/api/*` → Cache Level: Bypass
   - `/_next/static/*` → Cache Everything, TTL 1 ano
   - `/apps/*` → Cache Everything, TTL 1 mês
5. Vercel env vars:
   ```
   CLOUDFLARE_ZONE_ID=<zone_id>
   CLOUDFLARE_API_TOKEN=<api_token>
   ```

---

## 🔧 Passos Manuais (Ação Externa)

### A. Executar Script SQL de Particionamento (P3-1)
**Quando:** Antes de 50k usuários
**Onde:** Supabase SQL Editor

**Passos:**
1. Acesse https://supabase.com/dashboard → SQL Editor
2. Faça backup primeiro: Settings → Database → Backup
3. Cole o conteúdo de `scripts/supabase-partition-synceddelivery.sql`
4. Execute
5. Verifique: `SELECT tablename FROM pg_tables WHERE tablename LIKE 'SyncedDelivery_%' ORDER BY tablename;`
6. Deve mostrar 11 partições (6 meses anteriores + 5 futuros + default)
7. Se tudo OK, descomente e execute `DROP TABLE "SyncedDelivery_old";`

**Rollback se algo der errado:**
```sql
DROP TABLE "SyncedDelivery" CASCADE;
ALTER TABLE "SyncedDelivery_old" RENAME TO "SyncedDelivery";
```

---

### B. Configurar UptimeRobot (Health Check Externo)
**Quando:** Imediatamente
**Onde:** https://uptimerobot.com (free: 50 monitors)

**Passos:**
1. Crie conta UptimeRobot (free)
2. Add New Monitor:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** MeuCorre API Health
   - **URL:** `https://meucorre.vercel.app/api/health`
   - **Monitoring Interval:** 1 minute
   - **Alert When:** Status code ≠ 200
   - **Timeout:** 10 seconds
3. Configure alert contacts:
   - Email: clodoaldo608@gmail.com
   - (Opcional) Slack webhook
   - (Opcional) SMS/WhatsApp
4. Add segundo monitor:
   - **URL:** `https://meucorre.vercel.app` (landing page)
   - **Interval:** 5 minutes

---

### C. Configurar Sentry Alerts
**Quando:** Imediatamente
**Onde:** https://sentry.io

**Passos:**
1. Sentry → MeuCorre → Settings → Alerts
2. Create Alert Rule:
   - **Name:** Production Errors
   - **Condition:** When an issue is seen for the first time
   - **Filter:** `environment:production` AND `level:error`
   - **Action:** Send email to: clodoaldo608@gmail.com
3. Create segunda regra:
   - **Name:** High Error Rate
   - **Condition:** When issue count > 5 in 5 minutes
   - **Action:** Send Slack webhook (configurar integration)
4. Settings → Integrations → Slack → Configure
   - Channel: `#meucorre-alerts`
   - Events: `issue:created`, `error:high_rate`

---

### D. Configurar pg_cron no Supabase (P3-1)
**Quando:** Junto com script SQL de particionamento
**Onde:** Supabase SQL Editor

**Passos:**
1. Execute: `CREATE EXTENSION IF NOT EXISTS pg_cron;`
2. Execute o job do script de particionamento:
   ```sql
   SELECT cron.schedule(
     'create_synceddelivery_partition_monthly',
     '0 3 1 * *',
     $$
       SELECT create_monthly_partition(
         TO_CHAR(DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month'), 'YYYY-MM')
       );
     $$
   );
   ```
3. Verifique: `SELECT * FROM cron.job;`

---

### E. Configurar Resend Domain (Email)
**Quando:** Já configurado (confirmado via health)
**Onde:** https://resend.com

**Verificar:**
1. Resend → Domains → meucorre.com.br
2. Status deve ser "Verified"
3. Se não verificado: adicionar DNS records (SPF, DKIM, DMARC)
4. Testar: solicitar reset de senha em https://meucorre.vercel.app/recuperar-senha

---

## 📊 Resumo de Prontidão

| Componente | Status | Action Required |
|---|---|---|
| Deploy | ✅ Healthy (b7f2e1b) | — |
| Database | ✅ OK | — |
| Redis | ✅ OK | — |
| Sentry | ✅ Configured | Configurar alerts (C) |
| Resend | ✅ Configured | Verificar domain (E) |
| Kiwify | ✅ Configured | — |
| QStash | ❌ Not configured | Configurar (1) |
| Backup S3 | ❌ Not configured | Configurar (2) — ALTA PRIORIDADE |
| Edge Config | ❌ Not configured | Configurar (3) |
| Cloudflare CDN | ❌ Not configured | Configurar (4) |
| Particionamento DB | ❌ Not executed | Executar SQL (A) — antes de 50k |
| UptimeRobot | ❌ Not configured | Configurar (B) — IMEDIATO |
| Sentry Alerts | ❌ Not configured | Configurar (C) — IMEDIATO |
| pg_cron | ❌ Not configured | Configurar (D) — com particionamento |

## Prioridade de Ação

1. 🔴 **IMEDIATO:** UptimeRobot (B) + Sentry Alerts (C) — sem monitoramento, não saberemos se cair
2. 🟠 **ALTA:** Backup S3 (2) — sem backup, perda de dados é irrecoverável
3. 🟡 **MÉDIA:** QStash (1) — melhora resiliência do webhook
4. 🟢 **PODE ESPERAR:** Edge Config (3), Cloudflare (4), Particionamento (A)
