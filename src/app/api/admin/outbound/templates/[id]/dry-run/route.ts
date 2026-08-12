import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { substituteVariables } from "@/lib/outbound-variables";

// POST /api/admin/outbound/templates/:id/dry-run
// Gera preview da mensagem com variáveis substituídas — NÃO ENVIA NADA.
//
// Body:
//   { "partnerId": "...", "contactId": "..." }
//   OU
//   { "preview": { "NOME": "João", "EMPRESA": "Oficina do Zé", ... } }
//
// Se partnerId/contactId informados, busca dados reais e substitui.
// Se preview informado, usa o objeto direto.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    partnerId?: string;
    contactId?: string;
    preview?: Record<string, string>;
  };

  const template = await prisma.outboundTemplate.findUnique({ where: { id } });
  if (!template) {
    return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });
  }

  if (template.status === "archived") {
    return NextResponse.json(
      { error: "Template arquivado — não pode ser usado para dry-run" },
      { status: 400 },
    );
  }

  // Coleta variáveis
  let variables: Record<string, string> = {};

  if (body.partnerId && body.contactId) {
    // Busca dados reais
    const partner = await prisma.partner.findUnique({
      where: { id: body.partnerId },
      include: { contacts: { where: { id: body.contactId } } },
    });

    if (!partner) {
      return NextResponse.json({ error: "Parceiro não encontrado" }, { status: 404 });
    }
    if (partner.contacts.length === 0) {
      return NextResponse.json({ error: "Contato não encontrado ou não pertence ao parceiro" }, { status: 404 });
    }

    const contact = partner.contacts[0];

    // LGPD: bloqueia se optOut = true
    if (contact.optOut) {
      return NextResponse.json(
        {
          error: "OPT_OUT_BLOCKED",
          message: `Contato ${contact.name} marcou opt-out. NUNCA selecionar para envio.`,
          contactId: contact.id,
          optOut: true,
        },
        { status: 403 },
      );
    }

    variables = {
      NOME: contact.name.split(" ")[0] ?? contact.name,
      EMPRESA: partner.companyName,
      CIDADE: partner.city ?? "",
      ESTADO: partner.state ?? "",
      CATEGORIA: partner.category ?? "",
      MOTIVO: "", // preenchido manualmente no preview
      TELEFONE: contact.phone ?? "",
      EMAIL: contact.email ?? "",
      CARGO: contact.role ?? "",
    };
  } else if (body.preview && typeof body.preview === "object") {
    variables = body.preview;
  } else {
    return NextResponse.json(
      { error: "Informe partnerId+contactId ou objeto preview com variáveis" },
      { status: 400 },
    );
  }

  // Substitui variáveis no subject, body e cta
  const renderedSubject = template.subject
    ? substituteVariables(template.subject, variables)
    : null;
  const renderedBody = substituteVariables(template.body, variables);
  const renderedCta = template.cta
    ? substituteVariables(template.cta, variables)
    : null;
  const renderedOptOut = template.optOutText
    ? substituteVariables(template.optOutText, variables)
    : null;

  // Detecta variáveis não substituídas (ainda contêm {VARIAVEL})
  const missingVars = Array.from(renderedBody.matchAll(/\{([A-Z_]+)\}/g)).map((m) => m[1]);
  const missingUnique = Array.from(new Set(missingVars));

  return NextResponse.json({
    dryRun: true,
    template: {
      id: template.id,
      name: template.name,
      channel: template.channel,
      objective: template.objective,
      version: template.version,
    },
    variables,
    rendered: {
      subject: renderedSubject,
      body: renderedBody,
      cta: renderedCta,
      optOutText: renderedOptOut,
    },
    missingVariables: missingUnique,
    warnings: missingUnique.length > 0
      ? [`Variáveis não substituídas: ${missingUnique.join(", ")}`]
      : [],
  });
}
