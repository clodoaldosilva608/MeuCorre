import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// GET /api/admin/promotion/posts/:id/ics — gera ICS para uma postagem
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const post = await prisma.promotionPost.findUnique({
    where: { id },
    include: { campaign: true, asset: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Postagem não encontrada" }, { status: 404 });
  }

  const ics = generateICS([post]);
  const filename = `meucorre-post-M${String(Math.ceil(post.editorialDay / 30)).padStart(2, "0")}_D${String(post.editorialDay).padStart(2, "0")}_P${post.sequenceNumber}.ics`;

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

// ===== Utilidade: gerar ICS =====
// Formato RFC 5545. Lotes de 1 ou N postagens.
export function generateICS(
  posts: Array<{
    id: string;
    title: string;
    description: string;
    publishAt: Date;
    platform: string;
    editorialDay: number;
    sequenceNumber: number;
    campaign?: { name: string | null };
    hashtags?: string | null;
    destinationUrl?: string | null;
  }>,
): string {
  const dtstamp = formatICSDate(new Date());

  const events = posts
    .map((p) => {
      const dtstart = formatICSDate(p.publishAt);
      const dtend = formatICSDate(new Date(p.publishAt.getTime() + 30 * 60 * 1000)); // 30 min
      const summary = escapeICS(`[${p.platform}] ${p.title}`);
      const description = escapeICS(
        `${p.description}\n\n${p.hashtags ?? ""}\n\nLink: ${p.destinationUrl ?? "https://meucorre.vercel.app/"}`,
      );
      const uid = `${p.id}@meucorre.com.br`;
      const alarm = [
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        "DESCRIPTION:Lembrete de postagem MeuCorre",
        "TRIGGER:-PT15M",
        "END:VALARM",
      ].join("\r\n");

      return [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${dtstart}`,
        `DTEND:${dtend}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        `CATEGORIES:${escapeICS(p.platform)}`,
        "STATUS:CONFIRMED",
        alarm,
        "END:VEVENT",
      ].join("\r\n");
    })
    .join("\r\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MeuCorre//Plano 90 Dias//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:MeuCorre - Plano 90 Dias",
    "X-WR-TIMEZONE:America/Sao_Paulo",
    events,
    "END:VCALENDAR",
  ].join("\r\n");
}

function formatICSDate(d: Date): string {
  // YYYYMMDDTHHMMSSZ (UTC)
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeICS(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n")
    .slice(0, 5000);
}
