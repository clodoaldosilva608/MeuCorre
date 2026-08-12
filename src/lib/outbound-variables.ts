// Utilidade de substituição de variáveis em templates de outbound.
// Padrão: {VARIAVEL} — substitui pelo valor em variables (case-sensitive).
// Variável ausente → mantém o placeholder (para detecção de missing).

export function substituteVariables(
  text: string,
  variables: Record<string, string>,
): string {
  return text.replace(/\{([A-Z_]+)\}/g, (match, varName: string) => {
    const value = variables[varName];
    return value !== undefined && value !== null ? value : match;
  });
}

// Variáveis padrão suportadas nos templates de outbound.
export const STANDARD_VARIABLES = [
  { key: "NOME", description: "Primeiro nome do contato" },
  { key: "EMPRESA", description: "Nome da empresa parceira" },
  { key: "CIDADE", description: "Cidade da empresa" },
  { key: "ESTADO", description: "Estado da empresa (2 letras)" },
  { key: "CATEGORIA", description: "Categoria da empresa (oficina, pneus, etc.)" },
  { key: "MOTIVO", description: "Motivo do contato (preenchido manualmente no preview)" },
  { key: "TELEFONE", description: "Telefone do contato" },
  { key: "EMAIL", description: "Email do contato" },
  { key: "CARGO", description: "Cargo do contato" },
];

// Detecta variáveis referenciadas em um texto (padrão {VARIAVEL})
export function detectVariables(text: string): string[] {
  const matches = Array.from(text.matchAll(/\{([A-Z_]+)\}/g)).map((m) => m[1]);
  return Array.from(new Set(matches));
}
