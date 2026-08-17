import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { hashPassword } from "@/lib/user-auth";
import crypto from "crypto";
import { z } from "zod";

// PATCH /api/admin/users/[id] — atualiza usuário
// Body: { name?, password?, isPro?, phone?, city?, active?, trialExtendedUntil?, resetPassword? }
const bodySchema = z.object({
  name: z.string().max(500).optional(),
  password: z.string().max(500).optional(),
  isPro: z.string().max(500).optional(),
  phone: z.string().max(500).optional(),
  city: z.string().max(500).optional(),
  active: z.string().max(500).optional(),
  trialExtendedUntil: z.string().max(500).optional()
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
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

  const data: Record<string, unknown> = {};

  if (validatedBody.name !== undefined) {
    const name = validatedBody.name.trim();
    if (name.length < 2) return NextResponse.json({ error: "Nome inválido" }, { status: 400 });
    data.name = name;
  }

  if (validatedBody.password !== undefined) {
    if (validatedBody.password.length < 6)
      return NextResponse.json({ error: "Senha mínima 6 caracteres" }, { status: 400 });
    data.passwordHash = await hashPassword(validatedBody.password);
  }

  if (validatedBody.phone !== undefined) data.phone = validatedBody.phone.trim().slice(0, 30) || null;
  if (validatedBody.city !== undefined) data.city = validatedBody.city.trim().slice(0, 100) || null;
  if (validatedBody.active !== undefined) data.active = validatedBody.active;

  if (validatedBody.trialExtendedUntil !== undefined) {
    data.trialExtendedUntil = validatedBody.trialExtendedUntil
      ? new Date(validatedBody.trialExtendedUntil)
      : null;
  }

  // Toggle PRO
  if (validatedBody.isPro !== undefined) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    if (validatedBody.isPro && !user.isPro) {
      data.isPro = true;
      data.licenseKey = user.licenseKey ?? crypto.randomBytes(16).toString("hex");
      await prisma.subscription.create({
        data: {
          buyerName: user.name,
          buyerEmail: user.email,
          amount: 0,
          paymentMethod: "admin_grant",
          status: "approved",
          reviewedAt: new Date(),
          reviewedBy: "admin",
          reviewNotes: "PRO concedido pelo admin",
          licenseKey: data.licenseKey as string,
        },
      });

      // ===== Referral: se foi indicado, credita recompensa =====
      try {
        const referral = await prisma.referral.findUnique({
          where: { referredId: id },
        });
        if (referral && referral.status === "pending") {
          await prisma.referral.update({
            where: { id: referral.id },
            data: {
              status: "converted",
              convertedAt: new Date(),
            },
          });
        }
      } catch {
        // Referral falha não bloqueia grant
      }
    } else if (!validatedBody.isPro && user.isPro) {
      data.isPro = false;
      data.licenseKey = null;
    }
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
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
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }
}

// DELETE /api/admin/users/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }
}
