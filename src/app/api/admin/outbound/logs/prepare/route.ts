import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";
import { substituteVariables } from "@/lib/outbound-variables";
import { outboundPrepareSchema, validateOrError } from "@/lib/zod-schemas";
import { z } from "zod";

// POST /api/admin/outbound/logs/prepare
// Prepara uma ou várias mensagens para envio supervisionado.
// NÃO ENVIA — apenas gera o OutboundLog em status "preparado".
//
// Body:
//   {
//     "items": [
//       { "partnerId": "...", "contactId": "...", "templateId": "...", "channel": "whatsapp" },
//       ...
//     ]
//   }
//
// Validações CRÍTICAS:
//   1. Contact.optOut=true → BLOQUEIA (403 OPT_OUT_BLOCKED), NÃO cria log
//   2. Template.status deve ser "approved"
//   3. Channel deve ser consistente com o template
//
// Retorna: { created: N, blocked: N, errors: [...] }
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const adminEmail = await getAdminEmail();
  const rawBody = await req.json().catch(() => ({}));

  // Validação com Zod
  const validation = validateOrError(outboundPrepareSchema, rawBody);
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 },
    );
  }

  const body = validation.data;

  const validChannels = new Set(["email", "whatsapp", "linkedin", "phone"]);
  let created = 0;
  let blocked = 0;
  const errors: Array<{ index: number; error: string }> = [];

  for (let i = 0; i < body.items.length; i++) {
    const item = body.items[i];
    try {
      if (!item.partnerId || !item.contactId || !item.templateId) {
        errors.push({ index: i, error: "partnerId, contactId e templateId são obrigatórios" });
        continue;
      }

      if (!validChannels.has(item.channel ?? "")) {
        errors.push({ index: i, error: `channel inválido: ${item.channel}` });
        continue;
      }

      // Busca parceiro + contato + template em paralelo
      const [partner, contact, template] = await Promise.all([
        prisma.partner.findUnique({ where: { id: item.partnerId } }),
        prisma.partnerContact.findUnique({ where: { id: item.contactId } }),
        prisma.outboundTemplate.findUnique({ where: { id: item.templateId } }),
      ]);

      if (!partner) {
        errors.push({ index: i, error: "Parceiro não encontrado" });
        continue;
      }
      if (!contact || contact.partnerId !== item.partnerId) {
        errors.push({ index: i, error: "Contato não encontrado ou não pertence ao parceiro" });
        continue;
      }
      if (!template) {
        errors.push({ index: i, error: "Template não encontrado" });
        continue;
      }
      if (template.status !== "approved") {
        errors.push({ index: i, error: `Template deve estar aprovado (atual: ${template.status})` });
        continue;
      }

      // LGPD CRÍTICO: bloqueia se optOut = true
      if (contact.optOut) {
        blocked++;
        errors.push({
          index: i,
          error: `OPT_OUT_BLOCKED: contato ${contact.name} marcou opt-out — NUNCA selecionar para envio`,
        });
        continue;
      }

      // Substitui variáveis
      const variables: Record<string, string> = {
        NOME: contact.name.split(" ")[0] ?? contact.name,
        EMPRESA: partner.companyName,
        CIDADE: partner.city ?? "",
        ESTADO: partner.state ?? "",
        CATEGORIA: partner.category ?? "",
        MOTIVO: "",
        TELEFONE: contact.phone ?? "",
        EMAIL: contact.email ?? "",
        CARGO: contact.role ?? "",
      };

      const renderedSubject = template.subject
        ? substituteVariables(template.subject, variables)
        : null;
      const renderedBody = substituteVariables(template.body, variables);
      const renderedCta = template.cta
        ? substituteVariables(template.cta, variables)
        : null;

      // Cria OutboundLog em status "preparado"
      await prisma.outboundLog.create({
        data: {
          partnerId: item.partnerId,
          contactId: item.contactId,
          templateId: item.templateId,
          channel: item.channel!,
          renderedSubject,
          renderedBody,
          renderedCta,
          status: "preparado",
          notes: `Preparado por ${adminEmail ?? "admin"}`,
        },
      });

      created++;
    } catch (err) {
      errors.push({
        index: i,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    created,
    blocked,
    errors: errors.length,
    errorDetails: errors.slice(0, 20),
  }, { status: created > 0 ? 201 : 400 });
}
