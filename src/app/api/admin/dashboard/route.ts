import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// GET /api/admin/dashboard — estatísticas gerais pra home do admin
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const [
    totalAds,
    activeAds,
    totalSubscriptions,
    pendingSubscriptions,
    approvedSubscriptions,
    rejectedSubscriptions,
    totalFeedbacks,
    avgFeedbackRating,
    ads,
    approvedSubs,
  ] = await Promise.all([
    prisma.ad.count(),
    prisma.ad.count({ where: { active: true } }),
    prisma.subscription.count(),
    prisma.subscription.count({ where: { status: "pending" } }),
    prisma.subscription.count({ where: { status: "approved" } }),
    prisma.subscription.count({ where: { status: "rejected" } }),
    prisma.feedback.count(),
    prisma.feedback.aggregate({ _avg: { rating: true } }),
    prisma.ad.findMany({
      select: { views: true, clicks: true },
    }),
    prisma.subscription.findMany({
      where: { status: "approved" },
      select: { amount: true },
    }),
  ]);

  const totalViews = ads.reduce((s, a) => s + a.views, 0);
  const totalClicks = ads.reduce((s, a) => s + a.clicks, 0);
  const totalRevenue = approvedSubs.reduce((s, sub) => s + sub.amount, 0);
  const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

  return NextResponse.json({
    ads: {
      total: totalAds,
      active: activeAds,
      views: totalViews,
      clicks: totalClicks,
      ctr: Number(ctr.toFixed(2)),
    },
    subscriptions: {
      total: totalSubscriptions,
      pending: pendingSubscriptions,
      approved: approvedSubscriptions,
      rejected: rejectedSubscriptions,
      revenue: Number(totalRevenue.toFixed(2)),
    },
    feedbacks: {
      total: totalFeedbacks,
      avgRating: avgFeedbackRating._avg.rating
        ? Number(avgFeedbackRating._avg.rating.toFixed(2))
        : 0,
    },
  });
}
