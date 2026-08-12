import { NextResponse } from "next/server";
import { prismaRead } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

// GET /api/admin/metrics/alerts — Alertas de negócio
//
// Retorna alertas ativos categorizados:
//   - leads_sem_contato: parceiros em "novo_lead" ou "qualificando" há mais de 7 dias sem atividade
//   - proposta_vencida: propostas enviadas com validUntil passado e sem resposta
//   - campanha_expirando: campanhas publicadas com endsAt nos próximos 7 dias
//   - campanha_com_denuncia: campanhas com reportsCount >= 2
//   - follow_up_vencendo: atividades pending com scheduledAt passado
//   - atividade_atrasada: atividades pending com scheduledAt passado
//   - outbound_sem_resposta: mensagens enviadas há mais de 5 dias sem resposta
//
// Idempotente: apenas leitura, não altera dados.
export async function GET() {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const nextSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    leadsSemContato,
    propostasVencidas,
    campanhasExpirando,
    campanhasComDenuncia,
    followUpsVencendo,
    outboundSemResposta,
    propostasAprovadasSemAtivacao,
    campanhasExpiradasNaoMarcadas,
  ] = await Promise.all([
    // Leads sem contato há mais de 7 dias
    prismaRead.partner.findMany({
      where: {
        stage: { in: ["novo_lead", "qualificando"] },
        updatedAt: { lt: sevenDaysAgo },
        activities: { none: { createdAt: { gte: sevenDaysAgo } } },
      },
      include: {
        _count: { select: { contacts: true, activities: true } },
      },
      take: 50,
    }).catch(() => []),

    // Propostas vencidas (validUntil passado, status=sent)
    prismaRead.proposal.findMany({
      where: {
        status: "sent",
        validUntil: { lt: now },
      },
      include: {
        partner: { select: { id: true, companyName: true, city: true } },
      },
      take: 50,
    }).catch(() => []),

    // Campanhas expirando nos próximos 7 dias
    prismaRead.partnerCampaign.findMany({
      where: {
        status: "published",
        endsAt: { gte: now, lte: nextSevenDays },
      },
      include: {
        partner: { select: { companyName: true } },
      },
      take: 50,
    }).catch(() => []),

    // Campanhas com 2+ denúncias (próxima = auto-pausa)
    prismaRead.partnerCampaign.findMany({
      where: {
        status: "published",
        reportsCount: { gte: 2 },
      },
      include: {
        partner: { select: { companyName: true } },
      },
      take: 50,
    }).catch(() => []),

    // Atividades pending com scheduledAt passado
    prismaRead.partnerActivity.findMany({
      where: {
        status: "pending",
        scheduledAt: { lt: now },
      },
      include: {
        partner: { select: { id: true, companyName: true } },
        opportunity: { select: { title: true } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 50,
    }).catch(() => []),

    // Outbound enviado há mais de 5 dias sem resposta
    prismaRead.outboundLog.findMany({
      where: {
        status: "enviado",
        sentAt: { lt: fiveDaysAgo },
      },
      include: {
        partner: { select: { companyName: true } },
        contact: { select: { name: true } },
      },
      take: 50,
    }).catch(() => []),

    // Propostas aprovadas sem campanha publicada (ativacao pendente)
    prismaRead.proposal.findMany({
      where: {
        status: "approved",
        partner: {
          stage: "ativacao",
          campaigns: { none: { status: "published" } },
        },
      },
      include: {
        partner: { select: { id: true, companyName: true } },
      },
      take: 50,
    }).catch(() => []),

    // Campanhas published com endsAt passado (deveriam estar expired)
    prismaRead.partnerCampaign.count({
      where: {
        status: "published",
        endsAt: { lt: now },
      },
    }).catch(() => 0),
  ]);

  // Calcula scores de severidade
  const alerts = [
    {
      id: "leads_sem_contato",
      label: "Leads sem contato há 7+ dias",
      severity: "high" as const,
      count: leadsSemContato.length,
      items: leadsSemContato.map((p) => ({
        id: p.id,
        partnerId: p.id,
        companyName: p.companyName,
        city: p.city,
        stage: p.stage,
        daysSinceUpdate: Math.floor((now.getTime() - p.updatedAt.getTime()) / (24 * 60 * 60 * 1000)),
        contactsCount: p._count.contacts,
        activitiesCount: p._count.activities,
      })),
    },
    {
      id: "proposta_vencida",
      label: "Propostas vencidas sem resposta",
      severity: "high" as const,
      count: propostasVencidas.length,
      items: propostasVencidas.map((p) => ({
        id: p.id,
        partnerId: p.partner?.id,
        number: p.number,
        title: p.title,
        companyName: p.partner?.companyName,
        validUntil: p.validUntil,
        daysExpired: p.validUntil
          ? Math.floor((now.getTime() - new Date(p.validUntil).getTime()) / (24 * 60 * 60 * 1000))
          : 0,
      })),
    },
    {
      id: "campanha_expirando",
      label: "Campanhas expirando em 7 dias",
      severity: "medium" as const,
      count: campanhasExpirando.length,
      items: campanhasExpirando.map((c) => ({
        id: c.id,
        name: c.name,
        companyName: c.partner?.companyName,
        endsAt: c.endsAt,
        daysUntilExpiry: c.endsAt
          ? Math.ceil((new Date(c.endsAt).getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
          : 0,
      })),
    },
    {
      id: "campanha_com_denuncia",
      label: "Campanhas com 2+ denúncias (próxima = auto-pausa)",
      severity: "high" as const,
      count: campanhasComDenuncia.length,
      items: campanhasComDenuncia.map((c) => ({
        id: c.id,
        name: c.name,
        companyName: c.partner?.companyName,
        reportsCount: c.reportsCount,
      })),
    },
    {
      id: "atividade_atrasada",
      label: "Atividades atrasadas (pending + scheduledAt passado)",
      severity: "medium" as const,
      count: followUpsVencendo.length,
      items: followUpsVencendo.map((a) => ({
        id: a.id,
        partnerId: a.partnerId,
        companyName: a.partner?.companyName,
        title: a.title,
        type: a.type,
        scheduledAt: a.scheduledAt,
        assignedTo: a.assignedTo,
        daysLate: a.scheduledAt
          ? Math.floor((now.getTime() - new Date(a.scheduledAt).getTime()) / (24 * 60 * 60 * 1000))
          : 0,
      })),
    },
    {
      id: "outbound_sem_resposta",
      label: "Mensagens outbound sem resposta há 5+ dias",
      severity: "low" as const,
      count: outboundSemResposta.length,
      items: outboundSemResposta.map((l) => ({
        id: l.id,
        partnerId: l.partnerId,
        companyName: l.partner?.companyName,
        contactName: l.contact?.name,
        sentAt: l.sentAt,
        daysSinceSent: l.sentAt
          ? Math.floor((now.getTime() - new Date(l.sentAt).getTime()) / (24 * 60 * 60 * 1000))
          : 0,
      })),
    },
    {
      id: "proposta_aprovada_sem_ativacao",
      label: "Propostas aprovadas sem campanha publicada",
      severity: "medium" as const,
      count: propostasAprovadasSemAtivacao.length,
      items: propostasAprovadasSemAtivacao.map((p) => ({
        id: p.id,
        partnerId: p.partner?.id,
        number: p.number,
        title: p.title,
        companyName: p.partner?.companyName,
        approvedAt: p.approvedAt,
        daysSinceApproval: p.approvedAt
          ? Math.floor((now.getTime() - new Date(p.approvedAt).getTime()) / (24 * 60 * 60 * 1000))
          : 0,
      })),
    },
    {
      id: "campanhas_expiradas_nao_marcadas",
      label: "Campanhas expiradas não marcadas (sync pendente)",
      severity: "low" as const,
      count: campanhasExpiradasNaoMarcadas,
      items: [],
    },
  ];

  const totalAlerts = alerts.reduce((sum, a) => sum + a.count, 0);
  const highSeverityCount = alerts
    .filter((a) => a.severity === "high")
    .reduce((sum, a) => sum + a.count, 0);

  return NextResponse.json({
    generatedAt: now.toISOString(),
    totalAlerts,
    highSeverityCount,
    alerts,
  });
}
