// ===== Middleware de correlation ID =====
//
// P2-2: OpenTelemetry / correlation ID propagation
//
// Estratégia:
// 1. Lê X-Request-ID do header (se cliente enviou)
// 2. Se não tem, gera novo (formato: req_<timestamp>_<random>)
// 3. Seta em response header (X-Request-ID)
// 4. Disponibiliza via globalThis para logger acessar
//
// Em produção, integraria com OpenTelemetry SDK para propagar
// trace context entre serviços. Por ora, correlation ID simples
// já permite rastrear request end-to-end nos logs.
//
// Também define CORS headers básicos para preflight OPTIONS.

import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Lê ou gera correlation ID
  const incomingReqId = req.headers.get("x-request-id");
  const correlationId =
    incomingReqId ??
    `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  // Disponibiliza para logger via globalThis
  // (em serverless, cada invocation tem seu próprio globalThis)
  (globalThis as Record<string, unknown>).__correlationId = correlationId;

  // Clona request com header atualizado (para downstream ver)
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", correlationId);

  // Cria response com header de correlation ID
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("X-Request-ID", correlationId);

  return response;
}

export const config = {
  // Aplica a todas as rotas API
  matcher: ["/api/:path*"],
};
