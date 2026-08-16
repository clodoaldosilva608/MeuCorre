import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";
import { partnerCreateSchema, validateOrError } from "@/lib/zod-schemas";
import { z } from "zod";

// GET /api/admin/partners — lista parceiros com filtros
// Query: search, city, state, category, stage, status, assignedTo, priority, tag, limit, offset
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? undefined;
  const city = searchParams.get("city") ?? undefined;
  const state = searchParams.get("state") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const stage = searchParams.get("stage") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const assignedTo = searchParams.get("assignedTo") ?? undefined;
  const priority = searchParams.get("priority") ?? undefined;
  const tag = searchParams.get("tag") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), 500);
  const offset = Number(searchParams.get("offset") ?? 0);

  const where: Record<string, unknown> = {};
  if (city) where.city = { contains: city, mode: "insensitive" };
  if (state) where.state = state.toUpperCase();
  if (category) where.category = category;
  if (stage) where.stage = stage;
  if (status) where.status = status;
  if (assignedTo) where.assignedTo = assignedTo;
  if (priority) where.priority = priority;
  if (tag) where.tags = { contains: tag, mode: "insensitive" };
  if (search) {
    where.OR = [
      { companyName: { contains: search, mode: "insensitive" } },
      { tradeName: { contains: search, mode: "insensitive" } },
      { cnpj: { contains: search } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
  }

  const [partners, total] = await Promise.all([
    prisma.partner.findMany({
      where,
      include: {
        _count: {
          select: { contacts: true, opportunities: true, activities: true },
        },
      },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: limit,
      skip: offset,
    }),
    prisma.partner.count({ where }),
  ]);

  return NextResponse.json({ partners, total, limit, offset });
}

// POST /api/admin/partners — cria novo parceiro
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const adminEmail = await getAdminEmail();
  const rawBody = await req.json().catch(() => ({}));

  // Validação com Zod
  const validation = validateOrError(partnerCreateSchema, rawBody);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 },
    );
  }

  const body = validation.data;

  const validPriorities = ["baixa", "media", "alta", "urgente"];
  const priority = body.priority ?? "media";

  const validStages = [
    "novo_lead",
    "qualificando",
    "contato_iniciado",
    "descoberta",
    "proposta_enviada",
    "negociacao",
    "aguardando_aprovacao",
    "ativacao",
    "ativo",
    "renovacao",
    "perdido",
    "desqualificado",
  ];
  const stage = validStages.includes(body.stage ?? "")
    ? body.stage!
    : "novo_lead";

  const validStatuses = ["active", "paused", "archived", "lost", "disqualified"];
  const status = validStatuses.includes(body.status ?? "")
    ? body.status!
    : "active";

  // Valida CNPJ único se informado
  if (body.cnpj) {
    const existing = await prisma.partner.findUnique({
      where: { cnpj: body.cnpj.replace(/\D/g, "") },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Já existe um parceiro com este CNPJ", partner: existing },
        { status: 409 },
      );
    }
  }

  // Valida scores (0-100)
  const validScore = (v: unknown): number | null => {
    if (typeof v !== "number" || v < 0 || v > 100) return null;
    return Math.round(v);
  };

  try {
    const partner = await prisma.partner.create({
      data: {
        companyName: sanitizeString(body.companyName, 150),
        tradeName: sanitizeString(body.tradeName, 150) || null,
        cnpj: body.cnpj ? body.cnpj.replace(/\D/g, "") : null,
        category: sanitizeString(body.category, 50) || null,
        origin: sanitizeString(body.origin, 30) || "manual",
        city: sanitizeString(body.city, 100) || null,
        state: sanitizeString(body.state, 2)?.toUpperCase() || null,
        address: sanitizeString(body.address, 300) || null,
        website: sanitizeString(body.website, 300) || null,
        phone: sanitizeString(body.phone, 30) || null,
        email: sanitizeString(body.email, 100)?.toLowerCase() || null,
        logoUrl: sanitizeString(body.logoUrl, 500) || null,
        assignedTo: sanitizeString(body.assignedTo, 100) || "Clodoaldo Silva",
        priority,
        status,
        stage,
        relevanceScore: validScore(body.relevanceScore),
        benefitScore: validScore(body.benefitScore),
        reputationScore: validScore(body.reputationScore),
        capacityScore: validScore(body.capacityScore),
        riskScore: validScore(body.riskScore),
        tags: sanitizeString(body.tags, 300) || null,
        potentialValue: typeof body.potentialValue === "number" ? body.potentialValue : null,
        notes: sanitizeString(body.notes, 2000) || null,
      },
    });

    // Cria log de auditoria
    await prisma.partnerLog.create({
      data: {
        partnerId: partner.id,
        action: "created",
        details: JSON.stringify({ partner }),
        adminEmail,
        ipAddress: req.headers.get("x-forwarded-for") ?? null,
      },
    });

    return NextResponse.json({ partner }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Já existe um parceiro com este CNPJ" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Erro ao criar parceiro", detail: msg },
      { status: 500 },
    );
  }
}
