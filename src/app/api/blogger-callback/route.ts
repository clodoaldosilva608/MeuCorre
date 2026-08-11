import { NextRequest, NextResponse } from "next/server";

// ===== Callback do OAuth2 do Google para Blogger =====
//
// O Google redireciona para cá após o usuário autorizar.
// Exibe o código na tela para o usuário copiar e colar no chat.

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:50px;">
      <h1 style="color:red">❌ Erro</h1>
      <p>${error}</p>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } },
    );
  }

  if (!code) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:50px;">
      <h1>❌ Código não recebido</h1>
      </body></html>`,
      { headers: { "Content-Type": "text/html" } },
    );
  }

  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
    <body style="font-family:monospace;text-align:center;padding:60px;background:#0D0D0D;color:#39FF14;">
    <h1 style="font-size:24px;">✅ Autorizado!</h1>
    <p style="color:#fff;font-size:14px;">Copie o código abaixo e cole no chat:</p>
    <textarea readonly style="width:90%;max-width:600px;height:120px;font-size:14px;padding:15px;margin:20px auto;border:2px solid #39FF14;background:#1A1A1A;color:#39FF14;border-radius:8px;" onclick="this.select()">${code}</textarea>
    <p style="color:#888;font-size:12px;">Clique no código para selecionar tudo, depois Ctrl+C para copiar</p>
    </body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
