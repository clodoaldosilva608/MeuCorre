import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { z } from "zod";

// GET  /api/admin/affiliate-products → lista todos
// POST /api/admin/affiliate-products → cria novo

const VALID_TYPES = ["affiliate", "course", "ebook", "toolkit", "live", "subscription"];
const VALID_CATEGORIES = ["moto_acessorios", "cursos", "ebooks", "toolkits", "lives", "assinaturas"];
const VALID_PLATFORMS = ["shopee", "magalu", "amazon", "kiwify", "hotmart", "eduzz", "manual"];

const schema = z.object({
  type: z.enum(VALID_TYPES as [string, ...string[]]),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().max(500).optional().nullable(),
  url: z.string().url("URL inválida"),
  imageUrl: z.string().url().optional().nullable(),
  price: z.number().min(0).optional().nullable(),
  commission: z.number().min(0).max(100).optional().nullable(),
  category: z.enum(VALID_CATEGORIES as [string, ...string[]]).optional().nullable(),
  platform: z.enum(VALID_PLATFORMS as [string, ...string[]]).optional().nullable(),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
  notes: z.string().max(2000).optional().nullable(),
});

export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const products = await prisma.affiliateProduct.findMany({
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json({ products });
  } catch (err) {
    const error = err as { message?: string };
    console.error("[admin/affiliate-products] GET falhou:", err);
    return NextResponse.json({
      error: "Erro ao carregar produtos",
      details: error.message,
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
      { status: 400 },
    );
  }

  try {
    const product = await prisma.affiliateProduct.create({
      data: parsed.data,
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    const error = err as { message?: string };
    console.error("[admin/affiliate-products] POST falhou:", err);
    return NextResponse.json({ error: "Erro ao criar produto", details: error.message }, { status: 500 });
  }
}
