// ===== OpenTelemetry SDK (P3-4) =====
//
// P3-4: Instrumentação completa com traces distribuídos.
// Vercel tem suporte nativo a OpenTelemetry via @vercel/otel.
//
// Este arquivo é importado automaticamente pelo Next.js quando
// `instrumentationHook: true` está habilitado no next.config.ts.
//
// Recursos instrumentados:
// - HTTP requests (fetch, http/https)
// - Prisma queries
// - Redis (Upstash)
// - Custom spans (via trace.getSpan())
//
// Export para Vercel:
// - Vercel captura traces automaticamente (sem configuração extra)
// - Para Honeycomb/Datadog/Jaeger: configurar OTEL_EXPORTER_OTLP_ENDPOINT
//
// Uso em rotas:
//   import { trace } from "@opentelemetry/api";
//   const span = trace.getActiveSpan();
//   span?.setAttribute("userId", session.sub);
//   span?.setAttribute("deliveryCount", deliveries.length);

export async function register() {
  // Só registra em runtime Node.js (não Edge)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await registerOTel();
  }
}

async function registerOTel() {
  // @vercel/otel é o pacote oficial da Vercel para OpenTelemetry
  // Instala: npm install @vercel/otel @opentelemetry/api
  // Em Vercel: traces aparecem em Observability → Traces automaticamente.
  try {
    const { registerOTel } = await import("@vercel/otel");
    registerOTel({
      // Serviço identificado como "meucorre"
      serviceName: "meucorre",
      // Atributos globais em todos os traces
      attributes: {
        "service.version": process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
        "deployment.url": process.env.VERCEL_URL ?? "local",
        "cloud.region": process.env.VERCEL_REGION ?? "unknown",
      },
    });
    console.log("[otel] OpenTelemetry registrado com sucesso");
  } catch (err) {
    // @vercel/otel não instalado — usa correlation ID simples (P2-2)
    console.warn(
      "[otel] @vercel/otel não instalado, usando correlation ID básico (P2-2):",
      err instanceof Error ? err.message : err,
    );
  }
}

// Helper para criar span customizado em rotas críticas
// Uso:
//   import { withSpan } from "@/lib/otel";
//   const result = await withSpan("sync.deliveries", async (span) => {
//     span.setAttribute("userId", userId);
//     span.setAttribute("count", deliveries.length);
//     return await syncDeliveries(userId, deliveries);
//   });
export async function withSpan<T>(
  name: string,
  fn: (span?: { setAttribute: (key: string, value: string | number | boolean) => void }) => Promise<T>,
): Promise<T> {
  try {
    const { trace } = await import("@opentelemetry/api");
    const tracer = trace.getTracer("meucorre");
    return tracer.startActiveSpan(name, async (span) => {
      try {
        const result = await fn({
          setAttribute: (key: string, value: string | number | boolean) =>
            span.setAttribute(key, value),
        });
        span.setStatus({ code: 1 }); // OK
        return result;
      } catch (err) {
        span.setStatus({
          code: 2, // ERROR
          message: err instanceof Error ? err.message : "unknown",
        });
        span.recordException(err as Error);
        throw err;
      } finally {
        span.end();
      }
    });
  } catch {
    // @opentelemetry/api não disponível — executa sem span
    return await fn();
  }
}
