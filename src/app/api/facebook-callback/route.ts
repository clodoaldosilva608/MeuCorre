import { NextRequest, NextResponse } from "next/server";

// ===== Callback OAuth2 do Facebook =====
//
// O Facebook redireciona para cá após o usuário autorizar.
// Esta página mostra o código e tenta enviar automaticamente para a aba admin
// aberta (via window.opener / postMessage).

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:50px;background:#0a0a0a;color:#f4f4f5;">
      <h1 style="color:#ef4444">❌ Erro na autorização</h1>
      <p style="color:#a1a1aa">${error}</p>
      <p style="margin-top:20px;color:#71717a">Você pode fechar esta aba.</p>
      </body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  if (!code) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:50px;background:#0a0a0a;color:#f4f4f5;">
      <h1 style="color:#ef4444">❌ Código não recebido</h1>
      </body></html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Autorizando Facebook...</title></head>
    <body style="font-family:system-ui,sans-serif;text-align:center;padding:60px;background:#0a0a0a;color:#f4f4f5;">
    <div style="margin-bottom:20px;">
      <div style="display:inline-block;width:48px;height:48px;border:4px solid #1877F2;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;"></div>
    </div>
    <h1 style="font-size:22px;color:#1877F2;margin:0 0 8px;">✅ Autorizado com sucesso!</h1>
    <p style="color:#a1a1aa;font-size:14px;">Processando token...</p>
    <p id="status" style="color:#71717a;font-size:12px;margin-top:20px;">Aguardando...</p>
    <details style="margin-top:30px;text-align:left;max-width:600px;margin-left:auto;margin-right:auto;">
      <summary style="color:#71717a;cursor:pointer;font-size:12px;">Ver código (caso precise colar manual)</summary>
      <textarea readonly style="width:100%;height:100px;font-family:monospace;font-size:11px;padding:10px;margin-top:10px;border:1px solid #27272a;background:#18181b;color:#1877F2;border-radius:6px;" onclick="this.select()">${code}</textarea>
    </details>
    <script>
      (function() {
        const code = ${JSON.stringify(code)};
        const status = document.getElementById('status');

        if (window.opener && !window.opener.closed) {
          try {
            window.opener.postMessage({ type: 'facebook-oauth-code', code }, 'https://meucorre.vercel.app');
            status.textContent = '✓ Código enviado para a aba de admin. Você pode fechar esta aba.';
            setTimeout(() => window.close(), 2500);
            return;
          } catch (e) {
            status.textContent = 'Não foi possível enviar automaticamente. Copie o código abaixo.';
          }
        } else {
          status.textContent = 'Nenhuma aba de admin encontrada. Copie o código abaixo e cole na página de admin.';
        }
      })();
    </script>
    <style>@keyframes spin{to{transform:rotate(360deg);}}</style>
    </body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
