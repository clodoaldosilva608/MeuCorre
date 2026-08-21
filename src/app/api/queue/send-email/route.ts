import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/user-auth";
import { logger } from "@/lib/logger";

// POST /api/queue/send-email
// Rota invocada pela fila (QStash em prod, síncrono em dev) para enviar email.
// Em produção, QStash chama esta URL com o body enfileirado.
// Se QStash não configurado, é chamada síncrona via enqueue().
//
// Tipos suportados:
// - "reset-password": envia email de reset de senha via Resend

interface EmailJob {
  type: "reset-password";
  to: string;
  // Para reset-password:
  userName?: string;
  resetLink?: string;
  // Para outros tipos, adicionar campos aqui
}

export async function POST(req: NextRequest) {
  let body: EmailJob;
  try {
    body = (await req.json()) as EmailJob;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.type || !body.to) {
    return NextResponse.json({ error: "type e to obrigatórios" }, { status: 400 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    logger.warn("[queue/send-email] RESEND_API_KEY não configurado", {
      type: body.type,
      to: body.to,
    });
    // Não falha — QStash faria retry indefinidamente.
    // Retorna 200 para que QStash pare de tentar.
    return NextResponse.json({ ok: false, skipped: "no-resend-key" });
  }

  try {
    switch (body.type) {
      case "reset-password": {
        if (!body.resetLink) {
          return NextResponse.json(
            { error: "resetLink obrigatório para reset-password" },
            { status: 400 },
          );
        }

        const html = `
          <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0a0a0a;color:#f4f4f5">
            <div style="text-align:center;margin-bottom:24px">
              <img src="https://meucorre.vercel.app/logo-meucorre.png" alt="MeuCorre" style="height:48px" />
            </div>
            <h1 style="font-size:22px;color:#10b981;margin:0 0 12px">Recuperação de senha</h1>
            <p style="font-size:14px;line-height:1.6;color:#a1a1aa">
              Olá${body.userName ? `, ${body.userName}` : ""},
            </p>
            <p style="font-size:14px;line-height:1.6;color:#a1a1aa">
              Recebemos uma solicitação para redefinir sua senha do MeuCorre.
              Clique no botão abaixo para criar uma nova senha:
            </p>
            <div style="text-align:center;margin:24px 0">
              <a href="${body.resetLink}" style="display:inline-block;background:#10b981;color:#0a0a0a;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px">
                Redefinir senha
              </a>
            </div>
            <p style="font-size:12px;color:#71717a">
              Ou cole este link no navegador:<br>
              <span style="color:#10b981;word-break:break-all">${body.resetLink}</span>
            </p>
            <p style="font-size:12px;color:#71717a;margin-top:24px">
              Se você não solicitou esta recuperação, ignore este email.
              O link expira em 1 hora.
            </p>
            <hr style="border:0;border-top:1px solid #27272a;margin:24px 0" />
            <p style="font-size:11px;color:#52525b">
              MeuCorre — Finanças para quem move o Brasil.
            </p>
          </div>
        `;

        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "MeuCorre <no-reply@meucorre.com.br>",
            to: [body.to],
            subject: "Recuperação de senha — MeuCorre",
            html,
          }),
          signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) {
          const errText = await res.text();
          logger.error("[queue/send-email] Resend falhou", {
            to: body.to,
            status: res.status,
            errText: errText.slice(0, 200),
          });
          return NextResponse.json(
            { error: "Falha ao enviar email" },
            { status: 500 },
          );
        }

        logger.info("[queue/send-email] Email enviado", {
          type: body.type,
          to: body.to,
        });
        return NextResponse.json({ ok: true });
      }

      default:
        return NextResponse.json(
          { error: `Tipo de email desconhecido: ${body.type}` },
          { status: 400 },
        );
    }
  } catch (err) {
    logger.error("[queue/send-email] Erro", {
      type: body.type,
      error: err instanceof Error ? err.message : "unknown",
    });
    return NextResponse.json(
      { error: "Erro interno" },
      { status: 500 },
    );
  }
}
