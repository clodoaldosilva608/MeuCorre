import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";
import { z } from "zod";

// GET /api/admin/partners/:id/contacts — lista contatos do parceiro
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const contacts = await prisma.partnerContact.findMany({
    where: { partnerId: id },
    orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
  });

  return NextResponse.json({ contacts });
}

// POST /api/admin/partners/:id/contacts — adiciona contato ao parceiro
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const adminEmail = await getAdminEmail();
  const body = (await req.json()) as {
    name?: string;
    role?: string;
    email?: string;
    phone?: string;
    isPrimary?: boolean;
    optOut?: boolean;
    linkedinUrl?: string;
    notes?: string;
  };

  if (!body.name?.trim()) {
    return NextResponse.json(
      { error: "name é obrigatório" },
      { status: 400 },
    );
  }

  // Valida email se informado
  if (body.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 },
      );
    }
  }

  // Verifica se parceiro existe
  const partner = await prisma.partner.findUnique({ where: { id } });
  if (!partner) {
    return NextResponse.json({ error: "Parceiro não encontrado" }, { status: 404 });
  }

  // Se isPrimary=true, desmarca outros contatos primários
  if (body.isPrimary) {
    await prisma.partnerContact.updateMany({
      where: { partnerId: id, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  try {
    const contact = await prisma.partnerContact.create({
      data: {
        partnerId: id,
        name: sanitizeString(body.name, 150),
        role: sanitizeString(body.role, 80) || null,
        email: body.email ? sanitizeString(body.email, 100)?.toLowerCase() ?? null : null,
        phone: sanitizeString(body.phone, 30) || null,
        isPrimary: body.isPrimary ?? false,
        optOut: body.optOut ?? false,
        linkedinUrl: sanitizeString(body.linkedinUrl, 200) || null,
        notes: sanitizeString(body.notes, 500) || null,
      },
    });

    await prisma.partnerLog.create({
      data: {
        partnerId: id,
        action: "contact_added",
        details: JSON.stringify({ contact }),
        adminEmail,
        ipAddress: req.headers.get("x-forwarded-for") ?? null,
      },
    });

    return NextResponse.json({ contact }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar contato" }, { status: 500 });
  }
}
