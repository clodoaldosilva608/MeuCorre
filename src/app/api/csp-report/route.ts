import { NextRequest, NextResponse } from "next/server";

// POST /api/csp-report
// Recebe relatórios de violação de CSP do navegador.
// Em produção, integrar com Sentry ou logger externo.
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
  return NextResponse.json({ ok: true }, { status: 204 });
}
