import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { hashPassword } from "@/lib/user-auth";
import crypto from "crypto";
import { z } from "zod";

// GET /api/admin/users — lista todos os usuários
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter"); // all | pro | free

  const where = filter === "pro" ? { isPro: true } : filter === "free" ? { isPro: false } : {};

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      name: true,
      email: true,
      isPro: true,
      licenseKey: true,
      phone: true,
      city: true,
      active: true,
      trialExtendedUntil: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ users });
}

// POST /api/admin/users — cria novo usuário (admin pode criar)
// Body: { name, email, password, isPro?, phone?, city? }
const bodySchema = z.object({
  name: z.string().max(500).optional(),
  email: z.string().max(500).optional(),
  password: z.string().max(500).optional(),
  isPro: z.string().max(500).optional(),
  phone: z.string().max(500).optional(),
  city: z.string().max(500).optional()
});

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }
  const validatedBody = parsed.data;

  const name = validatedBody.name?.trim();
  const email = validatedBody.email?.trim().toLowerCase();
  const password = validatedBody.password;

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Nome inválido" }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json({ error: "Senha deve ter no mínimo 6 caracteres" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  // Se admin marcar como PRO, gera licença
  const isPro = validatedBody.isPro === "true";
  const licenseKey = isPro ? crypto.randomBytes(16).toString("hex") : null;

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      isPro,
      licenseKey,
      phone: validatedBody.phone?.trim().slice(0, 30) || null,
      city: validatedBody.city?.trim().slice(0, 100) || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      isPro: true,
      licenseKey: true,
      phone: true,
      city: true,
      createdAt: true,
    },
  });

  // Se PRO, cria também uma Subscription aprovada pra auditoria
  if (isPro && licenseKey) {
    await prisma.subscription.create({
      data: {
        buyerName: name,
        buyerEmail: email,
        buyerPhone: validatedBody.phone?.trim() || null,
        buyerCity: validatedBody.city?.trim() || null,
        amount: 0, // cortesia do admin
        paymentMethod: "admin_grant",
        status: "approved",
        reviewedAt: new Date(),
        reviewedBy: "admin",
        reviewNotes: "PRO concedido pelo admin",
        licenseKey,
      },
    });
  }

  return NextResponse.json({ user }, { status: 201 });
}
