import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sanitizeString } from "@/lib/validation";
import { applyRateLimit } from "@/lib/rate-limit";

// ===== API do Quiz de Captação de Leads =====
//
// POST /api/quiz/submit
// Recebe as respostas do quiz + email/phone do lead.
// Calcula um score de "quanto o entregador está perdendo" baseado nas respostas.
// Salva o Lead no banco (upsert por email — se já existe, atualiza).
// Retorna o resultado personalizado para mostrar na tela.
//
// Funil: Landing → Quiz → captura email → resultado → /app

interface QuizSubmitBody {
  email: string;
  phone?: string;
  name?: string;
  answers: {
    q1?: string;
    q2?: string;
    q3?: string;
    q4?: string;
  };
  referrerCode?: string;
}

function calculateScore(answers: QuizSubmitBody["answers"]): number {
  let score = 0;
  switch (answers.q1) {
    case "less_5": score += 30; break;
    case "5_10": score += 60; break;
    case "10_20": score += 120; break;
    case "more_20": score += 200; break;
  }
  switch (answers.q3) {
    case "yes": score += 0; break;
    case "more_less": score += 50; break;
    case "no_idea": score += 150; break;
  }
  switch (answers.q4) {
    case "gasolina": score += 80; break;
    case "which_app": score += 40; break;
    case "multi_app": score += 60; break;
    case "taxes": score += 100; break;
  }
  return score;
}

function generateResult(score: number, answers: QuizSubmitBody["answers"]): {
  title: string;
  message: string;
  weeklyLoss: number;
} {
  const weeklyLoss = Math.round((score / 200) * 180);

  if (answers.q3 === "no_idea") {
    return {
      title: "Você está perdendo dinheiro sem saber",
      message: `Com base nas suas respostas, você pode estar perdendo cerca de R$ ${weeklyLoss}/semana (R$ ${(weeklyLoss * 4).toFixed(0)}/mês) por não controlar suas despesas e faturamento. O MeuCorre organiza tudo em 1 app e mostra seu lucro real.`,
      weeklyLoss,
    };
  }

  if (score >= 200) {
    return {
      title: "Você está perdendo muito dinheiro",
      message: `Estimamos que você está perdendo R$ ${weeklyLoss}/semana (R$ ${(weeklyLoss * 4).toFixed(0)}/mês). Com o MeuCorre, você vê exatamente para onde cada real vai e identifica onde cortar despesas.`,
      weeklyLoss,
    };
  }

  if (score >= 100) {
    return {
      title: "Você está perdendo dinheiro",
      message: `Estimamos R$ ${weeklyLoss}/semana de perda. O MeuCorre ajuda a controlar despesas e ver seu lucro real por dia, semana e mês.`,
      weeklyLoss,
    };
  }

  return {
    title: "Você pode otimizar seus ganhos",
    message: `Com o MeuCorre, você ganha controle total: gráficos, metas, controle de despesas e muito mais. Não espere perder dinheiro para começar.`,
    weeklyLoss,
  };
}

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(
    req,
    { windowMs: 60 * 60 * 1000, maxRequests: 10 },
  );
  if (limited) return limited;

  let body: QuizSubmitBody;
  try {
    body = (await req.json()) as QuizSubmitBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const email = sanitizeString(body.email?.toLowerCase().trim() ?? "", 200);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const phone = body.phone ? sanitizeString(body.phone, 30) : null;
  const name = body.name ? sanitizeString(body.name, 100) : null;
  const referrerCode = body.referrerCode
    ? sanitizeString(body.referrerCode.toUpperCase(), 50)
    : null;

  const score = calculateScore(body.answers);
  const result = generateResult(score, body.answers);
  const quizAnswers = JSON.stringify(body.answers);

  try {
    const lead = await prisma.lead.upsert({
      where: { email },
      create: {
        email,
        phone,
        name,
        quizAnswers,
        resultScore: score,
        source: "quiz",
        referrerCode,
      },
      update: {
        phone: phone ?? undefined,
        name: name ?? undefined,
        quizAnswers,
        resultScore: score,
        referrerCode: referrerCode ?? undefined,
      },
    });

    return NextResponse.json({
      ok: true,
      leadId: lead.id,
      result,
    });
  } catch (error) {
    console.error("[quiz/submit] Erro ao salvar lead:", error);
    return NextResponse.json(
      { error: "Erro ao salvar lead. Tente novamente." },
      { status: 500 },
    );
  }
}
