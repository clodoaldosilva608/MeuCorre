import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { z } from "zod";

// ===== API de Redes Sociais (SocialProfile) =====
//
// GET  /api/admin/social-profiles          → lista todos os perfis
// POST /api/admin/social-profiles          → cria novo perfil
//
// Para atualizar/deletar: /api/admin/social-profiles/[id]

const VALID_PLATFORMS = [
  "instagram", "tiktok", "youtube", "facebook",
  "twitter", "telegram", "whatsapp", "linkedin",
  "kwai", "threads",
];

const VALID_MONETIZATION = ["none", "ads", "affiliates", "sponsorships", "products"];

const profileSchema = z.object({
  platform: z.enum(VALID_PLATFORMS as [string, ...string[]]),
  handle: z.string().min(1, "Handle é obrigatório"),
  url: z.string().url("URL inválida"),
  displayName: z.string().min(1).max(100).default("MeuCorre"),
  bio: z.string().max(500).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  followers: z.number().int().min(0).default(0),
  following: z.number().int().min(0).default(0),
  posts: z.number().int().min(0).default(0),
  monetization: z.enum(VALID_MONETIZATION as [string, ...string[]]).optional().nullable(),
  monetizationNotes: z.string().max(1000).optional().nullable(),
  contentStrategy: z.string().max(1000).optional().nullable(),
  postFrequency: z.string().max(100).optional().nullable(),
  bestTimes: z.string().max(200).optional().nullable(),
  active: z.boolean().default(true),
  verified: z.boolean().default(false),
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const profiles = await prisma.socialProfile.findMany({
      orderBy: [{ active: "desc" }, { platform: "asc" }],
      include: {
        _count: { select: { metrics: true } },
      },
    });
    return NextResponse.json({ profiles });
  } catch (err) {
    const error = err as { message?: string; code?: string };
    console.error("[admin/social-profiles] GET falhou:", err);
    return NextResponse.json({
      error: "Erro ao carregar perfis",
      details: error.message ?? "Erro desconhecido",
      code: error.code,
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  try {
    const profile = await prisma.socialProfile.create({
      data: parsed.data,
    });
    return NextResponse.json({ profile }, { status: 201 });
  } catch (err) {
    const error = err as { code?: string; message?: string };
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: `Plataforma ${parsed.data.platform} já existe` },
        { status: 409 },
      );
    }
    console.error("[admin/social-profiles] POST falhou:", err);
    return NextResponse.json({ error: "Erro ao criar perfil" }, { status: 500 });
  }
}
