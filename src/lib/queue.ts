// ===== Fila assíncrona (Upstash QStash) =====
//
// Usado para processar tarefas pesadas fora da request HTTP:
// - Webhook Kiwify (não bloqueia resposta se DB lento)
// - Envio de email (reset password)
// - Processamento de pagamentos
// - Notificações
//
// Estratégia:
// 1. Se QSTASH_TOKEN configurado → enfileira via QStash (processamento async)
// 2. Se não configurado → fallback síncrono (executa na hora)
//    Útil em dev e em ambientes sem QStash.
//
// Em serverless (Vercel), QStash é ideal porque:
// - Sobrevive a cold starts (jobs persistem)
// - Retries automáticos com backoff
// - DLQ (dead letter queue) integrado
// - Não conta no timeout de function (60s/300s)
//
// Uso:
//   import { enqueue } from "@/lib/queue";
//   await enqueue({
//     url: "/api/queue/send-email",
//     body: { to, subject, html },
//   });

interface QueueJob {
  // URL interna da rota que processa o job (ex: /api/queue/send-email)
  url: string;
  // Body da requisição (JSON serializado)
  body: unknown;
  // Delay opcional em segundos (ex: 60 = executa daqui 1 min)
  delaySeconds?: number;
  // Headers opcionais
  headers?: Record<string, string>;
}

interface QueueResult {
  ok: boolean;
  messageId?: string;
  // True se executou síncrono (fallback), false se foi para QStash
  sync: boolean;
  error?: string;
}

// Enfileira um job para processamento assíncrono.
// Se QStash não configurado, executa síncrono (fallback).
export async function enqueue(job: QueueJob): Promise<QueueResult> {
  const qstashToken = process.env.QSTASH_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  // 1. Tenta QStash (produção)
  if (qstashToken && appUrl) {
    try {
      const fullUrl = `${appUrl.replace(/\/$/, "")}${job.url}`;
      const res = await fetch("https://qstash.upstash.io/v1/publish/" + fullUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${qstashToken}`,
          "Content-Type": "application/json",
          ...(job.delaySeconds
            ? { "Upstash-Delay": `${job.delaySeconds}s` }
            : {}),
          ...job.headers,
        },
        body: JSON.stringify(job.body),
        signal: AbortSignal.timeout(3000),
      });

      if (!res.ok) {
        console.warn(
          `[queue] QStash falhou (${res.status}), fallback síncrono:`,
          await res.text(),
        );
        // Fallback síncrono
        return await executeSync(job);
      }

      const data = await res.json();
      return {
        ok: true,
        messageId: data.messageId,
        sync: false,
      };
    } catch (err) {
      console.warn(
        "[queue] QStash erro, fallback síncrono:",
        err instanceof Error ? err.message : err,
      );
      return await executeSync(job);
    }
  }

  // 2. Fallback síncrono (dev ou sem QStash configurado)
  return await executeSync(job);
}

// Executa o job síncrono (chamada interna para a rota /api/queue/*)
// Não bloqueia a request original se chamado com `void`.
async function executeSync(job: QueueJob): Promise<QueueResult> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const fullUrl = appUrl
      ? `${appUrl.replace(/\/$/, "")}${job.url}`
      : job.url;

    // Em serverless, self-invocation funciona mas adiciona latência
    const res = await fetch(fullUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Queue-Sync": "true", // marca como execução síncrona
        ...job.headers,
      },
      body: JSON.stringify(job.body),
      signal: AbortSignal.timeout(25000), // 25s max (Vercel 60s default)
    });

    if (!res.ok) {
      return {
        ok: false,
        sync: true,
        error: `Sync execution failed: ${res.status}`,
      };
    }

    return { ok: true, sync: true };
  } catch (err) {
    return {
      ok: false,
      sync: true,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

// Helper para verificar se QStash está configurado
export function isQStashConfigured(): boolean {
  return !!(process.env.QSTASH_TOKEN && process.env.NEXT_PUBLIC_APP_URL);
}
