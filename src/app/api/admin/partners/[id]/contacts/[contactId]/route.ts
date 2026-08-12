import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";

// PATCH /api/admin/partners/:id/contacts/:contactId
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id, contactId } = await params;
  const adminEmail = await getAdminEmail();
  const body = (await req.json()) as Record<string, unknown>;

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = sanitizeString(body.name as string, 150);
  if (body.role !== undefined) data.role = sanitizeString(body.role as string, 80) || null;
  if (body.email !== undefined) {
    if (body.email === null) {
      data.email = null;
    } else {
      const email = sanitizeString(body.email as string, 100)?.toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email && emailRegex.test(email)) data.email = email;
    }
  }
  if (body.phone !== undefined) data.phone = sanitizeString(body.phone as string, 30) || null;
  if (body.isPrimary !== undefined) data.isPrimary = Boolean(body.isPrimary);
  if (body.optOut !== undefined) data.optOut = Boolean(body.optOut);
  if (body.linkedinUrl !== undefined)
    data.linkedinUrl = sanitizeString(body.linkedinUrl as string, 200) || null;
  if (body.notes !== undefined) data.notes = sanitizeString(body.notes as string, 500) || null;

  // Se isPrimary=true, desmarca outros
  if (data.isPrimary === true) {
    await prisma.partnerContact.updateMany({
      where: { partnerId: id, isPrimary: true, NOT: { id: contactId } },
      data: { isPrimary: false },
    });
  }

  try {
    const contact = await prisma.partnerContact.update({
      where: { id: contactId },
      data,
    });

    // Log se mudou optOut
    if (data.optOut !== undefined) {
      await prisma.partnerLog.create({
        data: {
          partnerId: id,
          action: data.optOut ? "contact_opt_out" : "contact_opt_in",
          details: JSON.stringify({ contactId, contactName: contact.name }),
          adminEmail,
          ipAddress: req.headers.get("x-forwarded-for") ?? null,
        },
      });
    }

    return NextResponse.json({ contact });
  } catch {
    return NextResponse.json({ error: "Contato não encontrado" }, { status: 404 });
  }
}

// DELETE /api/admin/partners/:id/contacts/:contactId
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id, contactId } = await params;
  const adminEmail = await getAdminEmail();

  try {
    const contact = await prisma.partnerContact.delete({ where: { id: contactId } });

    await prisma.partnerLog.create({
      data: {
        partnerId: id,
        action: "contact_removed",
        details: JSON.stringify({ contactId, contactName: contact.name }),
        adminEmail,
        ipAddress: req.headers.get("x-forwarded-for") ?? null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Contato não encontrado" }, { status: 404 });
  }
}
