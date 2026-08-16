import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";
import { z } from "zod";

const VALID_CHANNELS = new Set(["email", "whatsapp", "linkedin", "phone"]);
const VALID_OBJECTIVES = new Set([
  "permission", "discovery", "proposal", "follow_up", "renewal",
]);

// POST /api/admin/outbound/templates/:id/version
// Cria uma nova versão do template (preserva a anterior como archived).
// A versão atual recebe parentTemplateId = id original e version incrementado.
//
// Body: { name?, channel?, segment?, objective?, subject?, body?, cta?, optOutText?, notes? }
// Campos não informados são copiados do template atual.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const adminEmail = await getAdminEmail();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const current = await prisma.outboundTemplate.findUnique({ where: { id } });
  if (!current) {
    return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });
  }

  // Conta versões existentes com o mesmo parentTemplateId (ou o próprio)
  const versionCount = await prisma.outboundTemplate.count({
    where: {
      OR: [{ id }, { parentTemplateId: current.parentTemplateId ?? id }],
    },
  });
  const newVersion = versionCount + 1;

  // Mescla campos: prioriza body, depois current
  const merged = {
    name: body.name !== undefined ? sanitizeString(body.name as string, 150) : current.name,
    channel:
      body.channel !== undefined && VALID_CHANNELS.has(body.channel as string)
        ? (body.channel as string)
        : current.channel,
    segment:
      body.segment !== undefined
        ? sanitizeString(body.segment as string, 100) || null
        : current.segment,
    objective:
      body.objective !== undefined && VALID_OBJECTIVES.has(body.objective as string)
        ? (body.objective as string)
        : current.objective,
    subject:
      body.subject !== undefined
        ? sanitizeString(body.subject as string, 200) || null
        : current.subject,
    body: body.body !== undefined ? (body.body as string) : current.body,
    cta:
      body.cta !== undefined
        ? sanitizeString(body.cta as string, 200) || null
        : current.cta,
    optOutText:
      body.optOutText !== undefined
        ? sanitizeString(body.optOutText as string, 200) || null
        : current.optOutText,
    notes:
      body.notes !== undefined
        ? sanitizeString(body.notes as string, 2000) || null
        : current.notes,
  };

  // Detecta variáveis no novo body
  const detectedVars = Array.from(merged.body.matchAll(/\{([A-Z_]+)\}/g)).map((m) => m[1]);
  const uniqueVars = Array.from(new Set(detectedVars));
  const variables = uniqueVars.join(",");

  // Transação: arquiva atual + cria nova versão
  const [newTemplate] = await prisma.$transaction([
    prisma.outboundTemplate.create({
      data: {
        name: merged.name,
        channel: merged.channel,
        segment: merged.segment,
        objective: merged.objective,
        subject: merged.subject,
        body: merged.body,
        cta: merged.cta,
        optOutText: merged.optOutText,
        variables,
        status: "draft",
        version: newVersion,
        parentTemplateId: current.parentTemplateId ?? current.id,
        notes: merged.notes,
        createdBy: adminEmail ?? "admin",
        createdByEmail: adminEmail,
      },
    }),
    // Arquiva o template atual
    prisma.outboundTemplate.update({
      where: { id },
      data: { status: "archived" },
    }),
  ]);

  return NextResponse.json({
    template: newTemplate,
    previousVersion: { id, version: current.version, archived: true },
  }, { status: 201 });
}
