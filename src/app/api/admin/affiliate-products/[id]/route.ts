import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { z } from "zod";

const VALID_TYPES = ["affiliate", "course", "ebook", "toolkit", "live", "subscription"];
const VALID_CATEGORIES = ["moto_acessorios", "cursos", "ebooks", "toolkits", "lives", "assinaturas"];
const VALID_PLATFORMS = ["shopee", "magalu", "amazon", "kiwify", "hotmart", "eduzz", "manual"];

const updateSchema = z.object({
  type: z.enum(VALID_TYPES as [string, ...string[]]).optional(),
  name: z.string().min(1).optional(),
  description: z.string().max(500).optional().nullable(),
  url: z.string().url().optional(),
  imageUrl: z.string().url().optional().nullable(),
  price: z.number().min(0).optional().nullable(),
  commission: z.number().min(0).max(100).optional().nullable(),
  category: z.enum(VALID_CATEGORIES as [string, ...string[]]).optional().nullable(),
  platform: z.enum(VALID_PLATFORMS as [string, ...string[]]).optional().nullable(),
  active: z.boolean().optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  notes: z.string().max(2000).optional().nullable(),
  // Métricas atualizáveis
  clicks: z.number().int().min(0).optional(),
  conversions: z.number().int().min(0).optional(),
  revenue: z.number().min(0).optional(),
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
    const updated = await prisma.affiliateProduct.update({
      where: { id },
      data: parsed.data,
    });
    return NextResponse.json({ product: updated });
  } catch (err) {
    const error = err as { code?: string; message?: string };
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }
    console.error("[admin/affiliate-products] PATCH falhou:", err);
    return NextResponse.json({ error: "Erro ao atualizar", details: error.message }, { status: 500 });
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
    await prisma.affiliateProduct.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const error = err as { code?: string };
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }
    console.error("[admin/affiliate-products] DELETE falhou:", err);
    return NextResponse.json({ error: "Erro ao remover" }, { status: 500 });
  }
}

// POST com ?action=click → incrementa contador de cliques (público)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  if (action === "click") {
    // Endpoint público para registrar clique (sem auth)
    try {
      await prisma.affiliateProduct.update({
        where: { id },
        data: { clicks: { increment: 1 } },
      });
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ error: "Erro ao registrar clique" }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
}
