import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";

// GET /api/admin/outbound/templates — lista templates
// Query: channel, status, objective, search, limit, offset
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const channel = searchParams.get("channel") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const objective = searchParams.get("objective") ?? undefined;
  const search = searchParams.get("search") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? 100), 500);
  const offset = Number(searchParams.get("offset") ?? 0);

  const where: Record<string, unknown> = {};
  if (channel) where.channel = channel;
  if (status) where.status = status;
  if (objective) where.objective = objective;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { body: { contains: search, mode: "insensitive" } },
      { segment: { contains: search, mode: "insensitive" } },
    ];
  }

  const [templates, total] = await Promise.all([
    prisma.outboundTemplate.findMany({
      where,
      include: { _count: { select: { logs: true } } },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      take: limit,
      skip: offset,
    }),
    prisma.outboundTemplate.count({ where }),
  ]);

  return NextResponse.json({ templates, total, limit, offset });
}

// POST /api/admin/outbound/templates — cria template
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const adminEmail = await getAdminEmail();
  const body = (await req.json()) as {
    name?: string;
    channel?: string;
    segment?: string;
    objective?: string;
    subject?: string;
    body?: string;
    cta?: string;
    optOutText?: string;
    variables?: string;
    status?: string;
    notes?: string;
  };

  if (!body.name?.trim() || !body.channel?.trim() || !body.objective?.trim() || !body.body?.trim()) {
    return NextResponse.json(
      { error: "name, channel, objective e body são obrigatórios" },
      { status: 400 },
    );
  }

  const validChannels = new Set(["email", "whatsapp", "linkedin", "phone"]);
  if (!validChannels.has(body.channel)) {
    return NextResponse.json(
      { error: `channel inválido. Válidos: ${Array.from(validChannels).join(", ")}` },
      { status: 400 },
    );
  }

  const validObjectives = new Set([
    "permission", "discovery", "proposal", "follow_up", "renewal",
  ]);
  if (!validObjectives.has(body.objective)) {
    return NextResponse.json(
      { error: `objective inválido. Válidos: ${Array.from(validObjectives).join(", ")}` },
      { status: 400 },
    );
  }

  // subject obrigatório para email
  if (body.channel === "email" && !body.subject?.trim()) {
    return NextResponse.json(
      { error: "subject é obrigatório para channel=email" },
      { status: 400 },
    );
  }

  const validStatuses = new Set(["draft", "approved", "paused", "archived"]);
  const status = validStatuses.has(body.status ?? "") ? body.status! : "draft";

  // Detecta variáveis no body (padrão {VARIAVEL})
  const detectedVars = Array.from(body.body.matchAll(/\{([A-Z_]+)\}/g)).map((m) => m[1]);
  const uniqueVars = Array.from(new Set(detectedVars));
  const variables = body.variables ?? uniqueVars.join(",");

  try {
    const template = await prisma.outboundTemplate.create({
      data: {
        name: sanitizeString(body.name, 150),
        channel: body.channel,
        segment: sanitizeString(body.segment, 100) || null,
        objective: body.objective,
        subject: sanitizeString(body.subject ?? "", 200) || null,
        body: body.body,
        cta: sanitizeString(body.cta ?? "", 200) || null,
        optOutText: sanitizeString(body.optOutText ?? "", 200) || null,
        variables: sanitizeString(variables, 500) || null,
        status,
        notes: sanitizeString(body.notes, 2000) || null,
        createdBy: adminEmail ?? "admin",
        createdByEmail: adminEmail,
        version: 1,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Erro ao criar template", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
