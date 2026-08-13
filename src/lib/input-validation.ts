// ===== Validação de input — helpers reutilizáveis =====
//
// Use em todos os endpoints que recebem body/params:
//   import { validateBody, validateId } from "@/lib/input-validation";
//
//   const { error, data } = validateBody(req.body, {
//     email: { type: "string", required: true, max: 200 },
//     name: { type: "string", required: true, max: 100 },
//   });
//   if (error) return 400;

type ValidationRule = {
  type: "string" | "number" | "boolean" | "email" | "url";
  required?: boolean;
  max?: number;
  min?: number;
  enum?: string[];
};

type ValidationSchema = Record<string, ValidationRule>;

interface ValidationResult {
  error: string | null;
  data: Record<string, unknown> | null;
}

/**
 * Valida um objeto contra um schema.
 * Retorna { error: null, data } se válido, ou { error: "mensagem", data: null } se inválido.
 */
export function validateBody(
  body: unknown,
  schema: ValidationSchema,
): ValidationResult {
  if (!body || typeof body !== "object") {
    return { error: "Body inválido", data: null };
  }

  const obj = body as Record<string, unknown>;
  const cleaned: Record<string, unknown> = {};

  for (const [field, rule] of Object.entries(schema)) {
    const value = obj[field];

    // Required check
    if (value === undefined || value === null || value === "") {
      if (rule.required) {
        return { error: `${field} é obrigatório`, data: null };
      }
      continue; // opcional, pula
    }

    // Type check
    switch (rule.type) {
      case "string":
        if (typeof value !== "string") {
          return { error: `${field} deve ser string`, data: null };
        }
        if (rule.max && value.length > rule.max) {
          return { error: `${field} excede ${rule.max} caracteres`, data: null };
        }
        if (rule.min && value.length < rule.min) {
          return { error: `${field} precisa de no mínimo ${rule.min} caracteres`, data: null };
        }
        cleaned[field] = value;
        break;

      case "number":
        const num = Number(value);
        if (isNaN(num)) {
          return { error: `${field} deve ser número`, data: null };
        }
        if (rule.min !== undefined && num < rule.min) {
          return { error: `${field} deve ser >= ${rule.min}`, data: null };
        }
        if (rule.max !== undefined && num > rule.max) {
          return { error: `${field} deve ser <= ${rule.max}`, data: null };
        }
        cleaned[field] = num;
        break;

      case "boolean":
        if (typeof value !== "boolean") {
          return { error: `${field} deve ser boolean`, data: null };
        }
        cleaned[field] = value;
        break;

      case "email":
        if (typeof value !== "string") {
          return { error: `${field} deve ser string`, data: null };
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return { error: `${field} é um email inválido`, data: null };
        }
        cleaned[field] = value.toLowerCase().trim();
        break;

      case "url":
        if (typeof value !== "string") {
          return { error: `${field} deve ser string`, data: null };
        }
        try {
          new URL(value);
        } catch {
          return { error: `${field} é uma URL inválida`, data: null };
        }
        cleaned[field] = value;
        break;
    }

    // Enum check
    if (rule.enum && !rule.enum.includes(String(cleaned[field]))) {
      return {
        error: `${field} deve ser um de: ${rule.enum.join(", ")}`,
        data: null,
      };
    }
  }

  return { error: null, data: cleaned };
}

/**
 * Valida que um ID é um CUID válido (não permite SQL injection via ID).
 */
export function validateId(id: string | undefined): { valid: boolean; error?: string } {
  if (!id || typeof id !== "string") {
    return { valid: false, error: "ID inválido" };
  }
  // CUID padrão: começa com 'c' + 24 chars alfanuméricos
  const cuidRegex = /^c[a-z0-9]{20,30}$/i;
  if (!cuidRegex.test(id)) {
    return { valid: false, error: "ID com formato inválido" };
  }
  return { valid: true };
}

/**
 * Sanitiza string removendo caracteres perigosos.
 * Previne XSS em conteúdo que será renderizado como HTML.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return "";
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}
