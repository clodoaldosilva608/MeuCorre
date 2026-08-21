# P3-5: Service Mesh — Decisão

## Contexto
A auditoria original recomendava "Migrate para service mesh (se aplicável)".
Após análise da arquitetura atual do MeuCorre, documentamos a decisão.

## Arquitetura atual
- **Single Next.js monolith** deployado na Vercel
- **API Routes** (165 rotas) — serverless functions
- **Prisma** → PostgreSQL (Supabase)
- **Redis** → Upstash (rate limit + cache + blacklist)
- **QStash** → Upstash (fila de jobs)
- **Sem microserviços** — não há comunicação service-to-service

## O que é Service Mesh?
Service mesh (Istio, Linkerd, Consul Connect) é uma infraestrutura que
gerencia comunicação entre microserviços:
- mTLS automático entre serviços
- Load balancing
- Circuit breaker
- Retries
- Observabilidade (traces distribuídos)
- Canary deployments

## Decisão: NÃO IMPLEMENTAR

### Razões

1. **Não aplicável a monólito**
   MeuCorre é um monólito Next.js. Service mesh é para microserviços.
   Implementar service mesh em monólito é overengineering.

2. **Vercel não suporta service mesh**
   Vercel serverless não permite sidecar containers (necessário para
   Istio/Linkerd). Service mesh exige Kubernetes ou VMs.

3. **Já temos equivalente funcional**
   - mTLS: Vercel HTTPS nativo
   - Circuit breaker: `src/lib/circuit-breaker.ts` (existe, mas é código
     morto — ativar em rotas externas como Kiwify/Resend)
   - Retries: QStash faz retries automáticos
   - Observabilidade: OpenTelemetry (P3-4) + correlation ID (P2-2)
   - Load balancing: Vercel faz nativamente

4. **Custo/benefício desfavorável**
   - Migrar para Kubernetes: $200+/mês infra + DevOps expertise
   - Manutenção: atualizações Istio/Linkerd, debugging sidecar
   - Latência: sidecar adiciona ~5ms por hop

## Quando reconsiderar?

Service mesh faria sentido se:
1. Migrar para microserviços (3+ serviços independentes)
2. Deployar em Kubernetes (não Vercel)
3. Necessitar de mTLS entre serviços (compliance)
4. Volume de comunicação service-to-service > 1000 req/s

Para o MeuCorre (SaaS de gestão financeira para entregadores),
nenhuma destas se aplica no horizonte de 100k usuários.

## Alternativas implementadas (equivalentes práticos)

### Em vez de service mesh, usamos:

1. **Queue-based communication** (QStash)
   - Comunicação assíncrona entre "serviços" (webhook → processamento)
   - Retries + DLQ + circuit breaker implícitos
   - Ver `src/lib/queue.ts`

2. **Circuit breaker explícito** (em vez de sidecar)
   - `src/lib/circuit-breaker.ts` (existe, ativar quando necessário)
   - Em rotas que chamam APIs externas (Kiwify, Resend)

3. **OpenTelemetry** (em vez de tracing de service mesh)
   - `src/instrumentation.ts` (P3-4)
   - Traces distribuídos via @vercel/otel
   - Correlation ID via middleware (P2-2)

4. **Rate limiting distribuído** (em vez de traffic control de mesh)
   - Redis distribuído (Upstash) — `src/lib/rate-limit.ts`
   - Aplicado por endpoint (P1-1)

5. **Migrations versionadas** (em vez de deployment canary)
   - Prisma migrations (a implementar — atualmente usa `db push`)
   - Deploy incremental com feature flags

## Próxima revisão
Reavaliar quando:
- 100k+ usuários ativos
- Decisão de migrar para microserviços
- Compliance requisitar mTLS service-to-service

Até lá, **NÃO implementar service mesh**.
