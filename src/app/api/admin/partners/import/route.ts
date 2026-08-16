import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed, getAdminEmail } from "@/lib/admin-auth";
import { sanitizeString } from "@/lib/validation";
import { z } from "zod";

// POST /api/admin/partners/import
// Importa parceiros via CSV ou array JSON.
//
// Body:
//   { "format": "json", "partners": [{...}, ...] }    — array de objetos
//   { "format": "csv", "csv": "companyName,city,...\n..." }  — string CSV
//
// Idempotente: se CNPJ existir, atualiza; senão, cria.
// Preview mode: { "preview": true } retorna o que seria criado/atualizado sem gravar.
//
// Campos aceitos: companyName*, tradeName, cnpj, category, origin, city, state,
// address, website, phone, email, assignedTo, priority, stage, status, tags,
// potentialValue, notes
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthed())) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const adminEmail = await getAdminEmail();
  const body = (await req.json()) as {
    format?: "json" | "csv";
    partners?: Record<string, unknown>[];
    csv?: string;
    preview?: boolean;
    defaultAssignedTo?: string;
    defaultCity?: string;
    defaultState?: string;
  };

  const format = body.format ?? "json";
  const isPreview = body.preview === true;
  const defaultAssignedTo = body.defaultAssignedTo || "Clodoaldo Silva";
  const defaultCity = body.defaultCity || "Recife";
  const defaultState = body.defaultState || "PE";

  // Converte input para array de parceiros
  let partnersInput: Record<string, unknown>[] = [];
  if (format === "csv" && body.csv) {
    partnersInput = parseCSV(body.csv);
  } else if (format === "json" && Array.isArray(body.partners)) {
    partnersInput = body.partners;
  } else {
    return NextResponse.json(
      { error: "format deve ser 'json' com 'partners' ou 'csv' com 'csv'" },
      { status: 400 },
    );
  }

  if (partnersInput.length === 0) {
    return NextResponse.json({ error: "Nenhum parceiro para importar" }, { status: 400 });
  }

  // Limita a 500 por requisição
  if (partnersInput.length > 500) {
    return NextResponse.json(
      { error: "Máximo 500 parceiros por requisição" },
      { status: 400 },
    );
  }

  const validStages = new Set([
    "novo_lead", "qualificando", "contato_iniciado", "descoberta",
    "proposta_enviada", "negociacao", "aguardando_aprovacao",
    "ativacao", "ativo", "renovacao", "perdido", "desqualificado",
  ]);
  const validPriorities = new Set(["baixa", "media", "alta", "urgente"]);
  const validStatuses = new Set(["active", "paused", "archived", "lost", "disqualified"]);

  const toCreate: Record<string, unknown>[] = [];
  const toUpdate: Record<string, unknown>[] = [];
  const errors: { row: number; error: string; data?: unknown }[] = [];

  for (let i = 0; i < partnersInput.length; i++) {
    const row = partnersInput[i];
    const companyName = sanitizeString(String(row.companyName ?? ""), 150);
    if (!companyName) {
      errors.push({ row: i + 1, error: "companyName obrigatório", data: row });
      continue;
    }

    const cnpj = row.cnpj ? String(row.cnpj).replace(/\D/g, "") : null;
    const stage = validStages.has(String(row.stage ?? "")) ? row.stage : "novo_lead";
    const priority = validPriorities.has(String(row.priority ?? "")) ? row.priority : "media";
    const status = validStatuses.has(String(row.status ?? "")) ? row.status : "active";

    const normalized: Record<string, unknown> = {
      companyName,
      tradeName: sanitizeString(String(row.tradeName ?? ""), 150) || null,
      cnpj,
      category: sanitizeString(String(row.category ?? ""), 50) || null,
      origin: sanitizeString(String(row.origin ?? "importacao_csv"), 30) || "importacao_csv",
      city: sanitizeString(String(row.city ?? defaultCity), 100) || defaultCity,
      state: sanitizeString(String(row.state ?? defaultState), 2)?.toUpperCase() || defaultState,
      address: sanitizeString(String(row.address ?? ""), 300) || null,
      website: sanitizeString(String(row.website ?? ""), 300) || null,
      phone: sanitizeString(String(row.phone ?? ""), 30) || null,
      email: sanitizeString(String(row.email ?? ""), 100)?.toLowerCase() || null,
      assignedTo: sanitizeString(String(row.assignedTo ?? defaultAssignedTo), 100) || defaultAssignedTo,
      priority,
      status,
      stage,
      tags: sanitizeString(String(row.tags ?? ""), 300) || null,
      notes: sanitizeString(String(row.notes ?? ""), 2000) || null,
    };

    const potentialValue = Number(row.potentialValue);
    if (!isNaN(potentialValue) && potentialValue >= 0) {
      normalized.potentialValue = potentialValue;
    }

    // Verifica duplicação por CNPJ
    if (cnpj) {
      const existing = await prisma.partner.findUnique({ where: { cnpj } });
      if (existing) {
        toUpdate.push({ ...normalized, id: existing.id });
        continue;
      }
    }

    // Verifica duplicação por companyName + city (case-insensitive)
    const existingByName = await prisma.partner.findFirst({
      where: {
        companyName: { equals: companyName, mode: "insensitive" },
        city: { equals: String(normalized.city), mode: "insensitive" },
      },
    });
    if (existingByName) {
      toUpdate.push({ ...normalized, id: existingByName.id });
      continue;
    }

    toCreate.push(normalized);
  }

  if (isPreview) {
    return NextResponse.json({
      preview: true,
      total: partnersInput.length,
      toCreate: toCreate.length,
      toUpdate: toUpdate.length,
      errors: errors.length,
      toCreateSample: toCreate.slice(0, 5),
      toUpdateSample: toUpdate.slice(0, 5),
      errorsSample: errors.slice(0, 10),
    });
  }

  // Gravação em transação
  let created = 0;
  let updated = 0;
  const errorsAfter: { row: number; error: string }[] = [...errors.map((e) => ({ row: e.row, error: e.error }))];

  for (const p of toCreate) {
    try {
      const partner = await prisma.partner.create({ data: p as never });
      await prisma.partnerLog.create({
        data: {
          partnerId: partner.id,
          action: "created",
          details: JSON.stringify({ source: "import_csv", partner: p }),
          adminEmail,
          ipAddress: req.headers.get("x-forwarded-for") ?? null,
        },
      });
      created++;
    } catch (err) {
      errorsAfter.push({
        row: toCreate.indexOf(p) + 1,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  for (const p of toUpdate) {
    try {
      const { id, ...data } = p;
      await prisma.partner.update({ where: { id: id as string }, data: data as never });
      await prisma.partnerLog.create({
        data: {
          partnerId: id as string,
          action: "updated",
          details: JSON.stringify({ source: "import_csv", changedFields: Object.keys(data) }),
          adminEmail,
          ipAddress: req.headers.get("x-forwarded-for") ?? null,
        },
      });
      updated++;
    } catch (err) {
      errorsAfter.push({
        row: toUpdate.indexOf(p) + 1,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json({
    total: partnersInput.length,
    created,
    updated,
    errors: errorsAfter.length,
    errorsSample: errorsAfter.slice(0, 10),
  });
}

// ===== Parser CSV simples =====
// Aceita header na primeira linha: companyName,tradeName,cnpj,category,...
// Suporta aspas duplas para campos com vírgula.
function parseCSV(csv: string): Record<string, unknown>[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const parseLine = (line: string): string[] => {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          fields.push(current);
          current = "";
        } else {
          current += ch;
        }
      }
    }
    fields.push(current);
    return fields;
  };

  const headers = parseLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const obj: Record<string, unknown> = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = values[j]?.trim() ?? "";
    }
    rows.push(obj);
  }

  return rows;
}
