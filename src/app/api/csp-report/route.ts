import { NextRequest, NextResponse } from "next/server";

// POST /api/csp-report
// Recebe relatórios de violação de CSP do navegador.
// Endpoint best-effort: nunca deve falhar (CSP report é fire-and-forget).
// PUBLIC ROUTE — Esta rota é intencionalmente pública (não requer admin auth)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Log estruturado (sem dados sensíveis)
    if (body?.["csp-report"]) {
      const report = body["csp-report"];
      console.warn("[CSP Violation]", {
        "violated-directive": report["violated-directive"],
        "blocked-uri": report["blocked-uri"],
        "document-uri": report["document-uri"],
        "line-number": report["line-number"],
        "source-file": report["source-file"],
      });
    }
  } catch {
    // Ignore parse errors — CSP reports são best-effort
  }
  // 204 No Content — sem body (RFC 7230 proíbe body em 204)
  return new NextResponse(null, { status: 204 });
}
