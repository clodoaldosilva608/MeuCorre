// ===== OpenTelemetry SDK (P3-4) =====
//
// P3-4: Instrumentação completa com traces distribuídos.
// Vercel tem suporte nativo a OpenTelemetry via @vercel/otel.
//
// Este arquivo é importado automaticamente pelo Next.js quando
// `instrumentationHook: true` está habilitado no next.config.ts.
//
// Nota: @vercel/otel e @opentelemetry/api são dependências OPCIONAIS.
// Se não estiverem instaladas, o sistema usa correlation ID simples
// do middleware (P2-2) como fallback.
//
// Para ativar OpenTelemetry completo:
//   npm install @vercel/otel @opentelemetry/api
// Depois o dynamic import abaixo vai funcionar automaticamente.

export async function register() {
  // Só registra em runtime Node.js (não Edge)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await registerOTel();
  }
}

async function registerOTel() {
  try {
    // Tenta carregar @vercel/otel dinamicamente usando eval para
    // contornar o TypeScript module resolver (módulo é opcional).
    // Se não estiver instalado, cai no catch e usa fallback.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await (Function('return import("@vercel/otel")')()).catch(() => null);
    if (!mod || typeof mod.registerOTel !== "function") {
      console.log("[otel] @vercel/otel não instalado — usando correlation ID do middleware");
      return;
    }

    mod.registerOTel({
      serviceName: "meucorre",
      attributes: {
        "service.version": process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
        "deployment.url": process.env.VERCEL_URL ?? "local",
        "cloud.region": process.env.VERCEL_REGION ?? "unknown",
      },
    });
    console.log("[otel] OpenTelemetry registrado com sucesso");
  } catch (err) {
    console.warn(
      "[otel] Falha ao registrar OpenTelemetry, usando correlation ID básico (P2-2):",
      err instanceof Error ? err.message : err,
    );
  }
}

// Helper para criar span customizado em rotas críticas.
// Se @opentelemetry/api não estiver instalado, executa sem span.
export async function withSpan<T>(
  name: string,
  fn: (span?: { setAttribute: (key: string, value: string | number | boolean) => void }) => Promise<T>,
): Promise<T> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await (Function('return import("@opentelemetry/api")')()).catch(() => null);
    if (!mod) {
      return await fn();
    }
    const tracer = mod.trace.getTracer("meucorre");
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
    // Fallback: executa sem span
    return await fn();
  }
}
