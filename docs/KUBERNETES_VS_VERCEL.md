# P4-1: Kubernetes vs Vercel — Decisão e Plano

## Contexto
A auditoria P4 recomendava "Migrar para Kubernetes (se Vercel limitar)".
Documentamos a decisão e o plano de migração.

## Arquitetura atual (Vercel)

```
Usuário → Vercel Edge (CDN global) → Vercel Functions (serverless)
                                         ↓
                                   Supabase Postgres (Washington DC)
                                   Upstash Redis (US-East-1)
                                   QStash (US-East-1)
```

## Limites da Vercel (plano Pro $20/mês)

| Recurso | Limite Vercel Pro | Quando atinge |
|---------|-------------------|---------------|
| Function duration | 300s (max) | Sync com 500 items + DB lento |
| Function memory | 1024MB (max) | Charts com muitos dados |
| Function invocations | 1M/mês (incluído) | 100k users × polling adaptativo = 15M/mês |
| Bandwidth | 1TB/mês | Landing 75KB × 100k views/dia = 225GB/mês |
| Build minutes | 6000/mês | OK |
| Edge function execution | 30s | OK para middleware |
| Cron jobs | 40 (plano Pro) | OK (3 jobs atuais) |

## Análise: Quando Vercel limita?

### Cenário 100k usuários
- **Function invocations**: 15M/mês (adaptive polling) — excede 1M grátis
  - Custo: 14M × $40/1M = **$560/mês extra** em function invocations
  - Vercel Enterprise ($1000+/mês) tem invocations ilimitadas
- **Bandwidth**: 225GB/mês — dentro do limite (1TB)
- **Function memory**: OK (1024MB é suficiente)
- **Function duration**: OK (sync agora usa LWW + chunking)
- **Region**: Vercel Pro só permite 1 região. Latência alta para BR (200ms RTT)

### Cenário 500k usuários (hipotético)
- Function invocations: 75M/mês
- Bandwidth: 1.1TB/mês (excede limite)
- Postgres connections: 60 (Supabase Pro) — PgBouncer lida

## Decisão: PERMANECER NA VERCEL até 100k usuários

### Razões

1. **Custo-benefício favorável até 100k**
   - Vercel Pro + function invocations: ~$580/mês
   - Kubernetes equivalente: $800-1500/mês (GKE/EKS + DB + Redis + CDN)
   - DevOps: 1 engenheiro $5k/mês (Kubernetes requer expertise)

2. **Latência resolvida com Edge**
   - Vercel Edge Functions rodam em 19+ regiões (incluindo São Paulo gru1)
   - Configuramos `regions: ["gru1"]` no vercel.json (Fase 1)
   - Latência <50ms para Brasil

3. **Migração seria reescrever deploy**
   - Dockerfile + CI/CD (GitHub Actions)
   - Kubernetes manifests (Deployment, Service, Ingress, HPA)
   - Monitoring (Prometheus + Grafana)
   - Logging (Loki ou Datadog $)
   - SSL/TLS (cert-manager)
   - Sem downtime deploy (rolling update)

4. **Serverless é mais simples**
   - Auto-scaling nativo
   - Pay-per-use (sem idle servers)
   - Sem infra management

## Quando migrar para Kubernetes?

Migrar quando UM destes acontecer:

1. **Function invocations > 50M/mês** (custo Vercel > $1500/mês)
2. **Necessitar long-running connections** (WebSocket nativo)
3. **Múltiplas regiões com DB local** (ex: BR + US + EU)
4. **Compliance** (dados não podem sair do Brasil — LGPD)
5. **Latência <10ms** (real-time crítico — gaming, trading)
6. **Custom runtime** (Rust, Go, não-suportado pelo Vercel)

Para MeuCorre (SaaS de gestão financeira), nenhum destes se aplica
até 100k usuários.

## Plano de migração (se necessário)

### Opção A: Railway/Render (mais simples)
- **Quando**: se só precisar de WebSocket + menor custo
- **Como**: migrar API Routes para Express/Fastify em container
- **Custo**: $20-100/mês (Railway) ou $84/mês (Render)
- **Esforço**: 2-3 semanas

### Opção B: GKE/EKS (escala total)
- **Quando**: se precisar de multi-region + compliance
- **Como**: Dockerfile + Helm charts + Terraform
- **Custo**: $500-2000/mês
- **Esforço**: 1-2 meses

### Opção C: Híbrido (recomendado para 100k-500k)
- Frontend: permanece Vercel (Edge + CDN ótimo)
- Backend: migrar API Routes para container em GKE (gRPC + REST)
- Database: Cloud SQL (Postgres com read replicas regionais)
- Cache: Redis Cloud (multi-region)
- Queue: Cloud Tasks (GCP) ou SQS (AWS)
- **Custo**: $300-800/mês
- **Esforço**: 1-2 meses

## Conclusão

**Permanecer na Vercel até 100k usuários.** Avaliar migração quando:
- Function invocations > 50M/mês
- WebSocket nativo necessário
- LGPD exigir dados no Brasil
