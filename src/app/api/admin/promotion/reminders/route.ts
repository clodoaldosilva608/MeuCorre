import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { z } from "zod";

// GET /api/admin/promotion/reminders — lista lembretes
// Query: postId, status, channel
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const channel = searchParams.get("channel") ?? undefined;

  const where: Record<string, unknown> = {};
  if (postId) where.postId = postId;
  if (status) where.status = status;
  if (channel) where.channel = channel;

  const reminders = await prisma.promotionReminder.findMany({
    where,
    include: {
      post: {
        select: {
          id: true,
          title: true,
          platform: true,
          publishAt: true,
          editorialDay: true,
          sequenceNumber: true,
        },
      },
    },
    orderBy: { remindAt: "asc" },
    take: 500,
  });

  return NextResponse.json({ reminders });
}

// POST /api/admin/promotion/reminders — cria lembrete
// Body:
//   { "postId": "...", "remindAt": "2026-08-12T15:15:00Z", "minutesBefore": 15, "channel": "browser" }
// Se minutesBefore informado e remindAt não, calcula a partir do publishAt do post.
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = (await req.json()) as {
    postId?: string;
    remindAt?: string;
    minutesBefore?: number;
    channel?: string;
  };

  if (!body.postId) {
    return NextResponse.json(
      { error: "postId é obrigatório" },
      { status: 400 },
    );
  }

  const post = await prisma.promotionPost.findUnique({
    where: { id: body.postId },
  });
  if (!post) {
    return NextResponse.json({ error: "Postagem não encontrada" }, { status: 404 });
  }

  const minutesBefore = body.minutesBefore ?? 15;
  const validChannels = ["browser", "email", "whatsapp"];
  const channel = validChannels.includes(body.channel ?? "")
    ? body.channel!
    : "browser";

  let remindAt: Date;
  if (body.remindAt) {
    remindAt = new Date(body.remindAt);
  } else {
    remindAt = new Date(post.publishAt.getTime() - minutesBefore * 60 * 1000);
  }

  const reminder = await prisma.promotionReminder.create({
    data: {
      postId: body.postId,
      remindAt,
      minutesBefore,
      channel,
      status: "pending",
    },
    include: { post: true },
  });

  return NextResponse.json({ reminder }, { status: 201 });
}
