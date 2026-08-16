import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { z } from "zod";

// PATCH /api/admin/social-profiles/[id] → atualiza perfil
// DELETE /api/admin/social-profiles/[id] → remove perfil

const VALID_PLATFORMS = [
  "instagram", "tiktok", "youtube", "facebook",
  "twitter", "telegram", "whatsapp", "linkedin",
  "kwai", "threads",
];

const VALID_MONETIZATION = ["none", "ads", "affiliates", "sponsorships", "products"];

const updateSchema = z.object({
  platform: z.enum(VALID_PLATFORMS as [string, ...string[]]).optional(),
  handle: z.string().min(1).optional(),
  url: z.string().url().optional(),
  displayName: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  followers: z.number().int().min(0).optional(),
  following: z.number().int().min(0).optional(),
  posts: z.number().int().min(0).optional(),
  monetization: z.enum(VALID_MONETIZATION as [string, ...string[]]).optional().nullable(),
  monetizationNotes: z.string().max(1000).optional().nullable(),
  contentStrategy: z.string().max(1000).optional().nullable(),
  postFrequency: z.string().max(100).optional().nullable(),
  bestTimes: z.string().max(200).optional().nullable(),
  active: z.boolean().optional(),
  verified: z.boolean().optional(),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.socialProfile.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json({ profile: updated });
  } catch (err) {
    const error = err as { code?: string };
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Plataforma já existe" },
        { status: 409 },
      );
    }
    console.error("[admin/social-profiles] PATCH falhou:", err);
    return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.socialProfile.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const error = err as { code?: string };
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 });
    }
    console.error("[admin/social-profiles] DELETE falhou:", err);
    return NextResponse.json({ error: "Erro ao remover perfil" }, { status: 500 });
  }
}
