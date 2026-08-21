import { NextRequest, NextResponse } from "next/server";
import { prisma, prismaRead } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { hashPassword } from "@/lib/user-auth";
import crypto from "crypto";
import { z } from "zod";

// GET /api/admin/users — lista usuários com paginação cursor-based
//
// SEGURANÇA/PERFORMANCE (P1-2 + P3-3):
// - Paginação cursor-based (limit 10-100 + cursor + hasMore)
// - P3-3: usa prismaRead (read replica) para queries de leitura admin
//   Redireciona carga do primary (escritas) para réplica (leituras)
//   Em 50k users, admin dashboard não compete com sync de usuários
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter"); // all | pro | free
  const cursor = searchParams.get("cursor"); // ID do último item da página anterior
  const limitParam = parseInt(searchParams.get("limit") ?? "50", 10);
  // Limita entre 10 e 100 (default 50)
  const limit = Math.min(Math.max(limitParam || 50, 10), 100);

  const where = filter === "pro" ? { isPro: true } : filter === "free" ? { isPro: false } : {};

  // P3-3: usa prismaRead (read replica) — leitura admin não compete com sync
  const users = await prismaRead.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
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

  const hasMore = users.length > limit;
  const items = hasMore ? users.slice(0, limit) : users;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({
    users: items,
    nextCursor,
    hasMore,
    limit,
  });
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
