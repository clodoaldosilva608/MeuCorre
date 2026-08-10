import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { hashPassword } from "@/lib/user-auth";
import crypto from "crypto";

// PATCH /api/admin/users/[id] — atualiza usuário
// Body: { name?, password?, isPro?, phone?, city?, active?, trialExtendedUntil?, resetPassword? }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  let body: {
    name?: string;
    password?: string;
    isPro?: boolean;
    phone?: string;
    city?: string;
    active?: boolean;
    trialExtendedUntil?: string | null;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (name.length < 2) return NextResponse.json({ error: "Nome inválido" }, { status: 400 });
    data.name = name;
  }

  if (body.password !== undefined) {
    if (body.password.length < 6)
      return NextResponse.json({ error: "Senha mínima 6 caracteres" }, { status: 400 });
    data.passwordHash = await hashPassword(body.password);
  }

  if (body.phone !== undefined) data.phone = body.phone.trim().slice(0, 30) || null;
  if (body.city !== undefined) data.city = body.city.trim().slice(0, 100) || null;
  if (body.active !== undefined) data.active = body.active;

  if (body.trialExtendedUntil !== undefined) {
    data.trialExtendedUntil = body.trialExtendedUntil
      ? new Date(body.trialExtendedUntil)
      : null;
  }

  // Toggle PRO
  if (body.isPro !== undefined) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    if (body.isPro && !user.isPro) {
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
    } else if (!body.isPro && user.isPro) {
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
