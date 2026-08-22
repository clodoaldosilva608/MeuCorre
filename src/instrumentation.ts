// ===== Instrumentation hook =====
//
// P3-4: OpenTelemetry — arquivo reservado para futura instrumentação.
// Atualmente vazio para não quebrar o build da Vercel.
//
// Para ativar OpenTelemetry completo:
// 1. npm install @vercel/otel @opentelemetry/api
// 2. Descomente o código abaixo
// 3. Redeploy

/*
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerOTel } = await import("@vercel/otel");
    registerOTel({
      serviceName: "meucorre",
      attributes: {
        "service.version": process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
        "deployment.url": process.env.VERCEL_URL ?? "local",
        "cloud.region": process.env.VERCEL_REGION ?? "unknown",
      },
    });
    console.log("[otel] OpenTelemetry registrado com sucesso");
  }
}

export async function withSpan<T>(
  name: string,
  fn: (span?: { setAttribute: (key: string, value: string | number | boolean) => void }) => Promise<T>,
): Promise<T> {
  // Sem OpenTelemetry — executa sem span
  return await fn();
}
*/

// Export vazio para manter compatibilidade com imports existentes
export async function withSpan<T>(
  _name: string,
  fn: (span?: { setAttribute: (key: string, value: string | number | boolean) => void }) => Promise<T>,
): Promise<T> {
  return await fn();
}
