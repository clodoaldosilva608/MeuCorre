// ===== Biblioteca de Security Scanner =====
//
// Scanner de segurança que roda 5 categorias de testes:
// 1. Secrets (estilo Gitleaks) - chaves/tokens/senhas expostos
// 2. RLS - Row Level Security no Prisma/Supabase
// 3. Auth/IDOR - rotas API que validam permissão do dono
// 4. Input Validation - sanitização de inputs do usuário
// 5. Rate Limiting - rotas sensíveis sem rate limit
//
// Usa: import { runSecurityScan, runSingleScan } from "@/lib/security-scanner"

import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, extname, relative } from "path";
import { execSync } from "child_process";

export type Severity = "critical" | "high" | "medium" | "low";
export type ScanCategory = "secrets" | "rls" | "auth" | "input" | "ratelimit";

export interface Finding {
  id: string;
  category: ScanCategory;
  file: string;
  line: number;
  severity: Severity;
  rule: string;
  description: string;
  match?: string;
  recommendation: string;
}

export interface ScanResult {
  category: ScanCategory;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  filesScanned: number;
  findings: Finding[];
  score: number; // 0-100
  summary: string;
}

export interface FullScanResult {
  id: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  results: Record<ScanCategory, ScanResult>;
  totalFindings: number;
  overallScore: number;
}

const IGNORE_DIRS = ["node_modules", ".next", ".git", "dist", "build", "coverage", "db", "upload", "screenshots"];
const SCAN_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

function shouldIgnore(path: string): boolean {
  return IGNORE_DIRS.some((d) => path.includes(`/${d}/`) || path.startsWith(`${d}/`));
}

function readDirRecursive(dir: string, files: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (IGNORE_DIRS.includes(entry)) continue;
    const full = join(dir, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) {
      readDirRecursive(full, files);
    } else if (stat.isFile() && SCAN_EXTENSIONS.includes(extname(full))) {
      files.push(full);
    }
  }
  return files;
}

function readFileSafe(path: string): string | null {
  try {
    return readFileSync(path, "utf-8");
  } catch {
    return null;
  }
}

// ============ SCANNER 1: SEGREDS ============
const SECRET_PATTERNS: Array<{ name: string; regex: RegExp; severity: Severity; rec: string }> = [
  { name: "OpenAI API Key", regex: /sk-[a-zA-Z0-9]{20,}/, severity: "critical", rec: "Mover para env var server-side" },
  { name: "Stripe Secret Key", regex: /sk_live_[a-zA-Z0-9]{20,}/, severity: "critical", rec: "Nunca usar sk_live_ no código" },
  { name: "AWS Access Key", regex: /AKIA[0-9A-Z]{16}/, severity: "critical", rec: "Rotar imediatamente no console AWS" },
  { name: "GitHub Token", regex: /gh[pousr]_[A-Za-z0-9]{36}/, severity: "critical", rec: "Revogar em github.com/settings/tokens" },
  { name: "Telegram Bot Token", regex: /\d{8,12}:[A-Za-z0-9_-]{30,}/, severity: "critical", rec: "Revogar com @BotFather /revoke" },
  { name: "Supabase service_role JWT", regex: /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/, severity: "critical", rec: "service_role NUNCA no frontend" },
  { name: "JWT Secret hardcoded", regex: /(jwt[_-]?secret|secret[_-]?key)\s*[:=]\s*["'][^"']{16,}["']/i, severity: "high", rec: "Mover para env var" },
  { name: "Private Key PEM", regex: /-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----/, severity: "critical", rec: "Remover do código" },
  { name: "Bearer Token hardcoded", regex: /Bearer\s+[a-zA-Z0-9\-_\.]{20,}/, severity: "high", rec: "Token deve vir de auth dinâmica" },
];

function scanSecrets(): ScanResult {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const findings: Finding[] = [];
  const files = readDirRecursive("src").concat(readDirRecursive("scripts"));
  let scanned = 0;

  for (const file of files) {
    // Pula scripts de teste/seed (têm senhas fake legitimamente)
    if (file.includes("create-") || file.includes("test-") || file.includes("e2e-")) continue;
    const content = readFileSafe(file);
    if (!content) continue;
    scanned++;

    const lines = content.split("\n");
    lines.forEach((line, idx) => {
      if (line.trim().startsWith("//") || line.trim().startsWith("#")) return;
      if (line.includes("exemplo") || line.includes("placeholder") || line.includes("seu_")) return;

      for (const p of SECRET_PATTERNS) {
        const m = line.match(p.regex);
        if (m && !m[0].includes("example") && !m[0].includes("test")) {
          findings.push({
            id: `secrets-${file}-${idx}-${p.name}`.replace(/[^a-z0-9-]/gi, ""),
            category: "secrets",
            file: relative(".", file),
            line: idx + 1,
            severity: p.severity,
            rule: p.name,
            description: `Possível ${p.name} exposto no código`,
            match: m[0].substring(0, 25) + "...",
            recommendation: p.rec,
          });
        }
      }
    });
  }

  // Verifica .env no git
  try {
    const tracked = execSync("git ls-files .env", { encoding: "utf-8" }).trim();
    if (tracked) {
      findings.push({
        id: "secrets-env-tracked",
        category: "secrets",
        file: ".env",
        line: 0,
        severity: "critical",
        rule: "Env File Tracked",
        description: ".env está tracked no git (vai para o repositório)",
        recommendation: "Rode: git rm --cached .env",
      });
    }
  } catch { /* ignore */ }

  // Verifica .env no .gitignore
  const gitignore = existsSync(".gitignore") ? readFileSync(".gitignore", "utf-8") : "";
  if (!gitignore.includes(".env")) {
    findings.push({
      id: "secrets-env-not-ignored",
      category: "secrets",
      file: ".gitignore",
      line: 0,
      severity: "critical",
      rule: "Env Not Ignored",
      description: ".env não está no .gitignore",
      recommendation: "Adicione '.env' ao .gitignore",
    });
  }

  const score = Math.max(0, 100 - findings.length * 15);
  const finishedAt = new Date().toISOString();
  return {
    category: "secrets",
    startedAt,
    finishedAt,
    durationMs: Date.now() - t0,
    filesScanned: scanned,
    findings,
    score,
    summary: `${findings.length} segredo(s) exposto(s) em ${scanned} arquivos`,
  };
}

// ============ SCANNER 2: RLS ============
function scanRLS(): ScanResult {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const findings: Finding[] = [];

  // Verifica Prisma schema
  const schemaPath = "prisma/schema.prisma";
  const schema = readFileSafe(schemaPath);

  if (schema) {
    // Verifica se usa Supabase (precisa de RLS)
    if (schema.includes("postgresql") || schema.includes("supabase")) {
      // Lista todos os models
      const models = schema.match(/model\s+(\w+)\s*{/g) || [];
      const modelNames = models.map((m) => m.match(/model\s+(\w+)/)?.[1]).filter(Boolean);

      // Verifica se há migration SQL com RLS habilitado
      const migrationsDir = "supabase/migrations";
      let hasRLS = false;
      try {
        const migrations = readdirSync(migrationsDir);
        for (const m of migrations) {
          const content = readFileSafe(join(migrationsDir, m, "migration.sql"));
          if (content && content.includes("ENABLE ROW LEVEL SECURITY")) {
            hasRLS = true;
            break;
          }
        }
      } catch { /* dir não existe */ }

      if (!hasRLS) {
        findings.push({
          id: "rls-not-enabled",
          category: "rls",
          file: schemaPath,
          line: 0,
          severity: "high",
          rule: "RLS Not Enabled",
          description: `Banco PostgreSQL/Supabase detectado mas nenhuma migration com ENABLE ROW LEVEL SECURITY encontrada`,
          recommendation: `Para cada tabela: ALTER TABLE public.nome_tabela ENABLE ROW LEVEL SECURITY;`,
        });
      }
    }
  }

  // Verifica uso de service_role no client
  // src/lib/ é server-side (não vai pro bundle do browser)
  // src/app/admin/ são páginas admin (protegidas por admin auth)
  const files = readDirRecursive("src").filter(
    (f) => !f.includes("src/lib/") && !f.includes("src/components/") && !f.includes("src/app/admin/")
  );
  for (const file of files) {
    const content = readFileSafe(file);
    if (!content) continue;

    // service_role key nunca deve ir pro client (apenas em /api/ ou /lib/)
    if (content.includes("SUPABASE_SERVICE_ROLE_KEY") || content.includes("service_role")) {
      if (!file.includes("/api/") && !file.includes("/lib/")) {
        findings.push({
          id: `rls-servicerole-${file}`.replace(/[^a-z0-9-]/gi, ""),
          category: "rls",
          file: relative(".", file),
          line: (content.split("\n").findIndex((l) => l.includes("service_role")) || 0) + 1,
          severity: "critical",
          rule: "Service Role in Client",
          description: "Chave service_role referenciada em código client-side",
          recommendation: "service_role NUNCA no frontend. Use apenas em /api/ routes",
        });
      }
    }
  }

  const score = Math.max(0, 100 - findings.length * 25);
  const finishedAt = new Date().toISOString();
  return {
    category: "rls",
    startedAt,
    finishedAt,
    durationMs: Date.now() - t0,
    filesScanned: files.length,
    findings,
    score,
    summary: findings.length === 0 ? "RLS configurado corretamente" : `${findings.length} problema(s) de RLS`,
  };
}

// ============ SCANNER 3: AUTH/IDOR ============
function scanAuth(): ScanResult {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const findings: Finding[] = [];
  const apiFiles = readDirRecursive("src/app/api");

  for (const file of apiFiles) {
    if (!file.endsWith("route.ts")) continue;
    const content = readFileSafe(file);
    if (!content) continue;

    const lines = content.split("\n");
    const routePath = relative(".", file).replace("/route.ts", "").replace("src/app/api", "/api");

    // Pula rotas explicitamente públicas
    if (content.includes("// PUBLIC") || content.includes("// NO AUTH REQUIRED")) continue;
    // Pula rotas de webhook (têm auth própria via signature)
    if (file.includes("webhooks/")) continue;
    // Pula rotas públicas explícitas
    if (file.includes("api/health") || file.includes("api/csp-report")) continue;

    // Verifica se tem isAdminAuthed ou getUserSession
    const hasAdminAuth = content.includes("isAdminAuthed");
    const hasUserAuth = content.includes("getUserSession") || content.includes("getUser");
    const hasPublicMarker = content.includes("// PUBLIC ROUTE");

    if (!hasAdminAuth && !hasUserAuth && !hasPublicMarker) {
      // Pula rotas /api/ads, /api/blog, /api/offers, /api/auth (públicas por design)
      if (file.includes("api/ads") || file.includes("api/blog") || file.includes("api/offers") || file.includes("api/auth")) continue;
      // Pula rotas public/
      if (file.includes("api/public/")) continue;

      findings.push({
        id: `auth-${file}`.replace(/[^a-z0-9-]/gi, ""),
        category: "auth",
        file: relative(".", file),
        line: 0,
        severity: "high",
        rule: "Missing Auth Check",
        description: `Rota ${routePath} não verifica autenticação`,
        recommendation: "Adicione: if (!(await isAdminAuthed())) return 401; ou getUserSession()",
      });
    }

    // IDOR: busca por findUnique/findFirst com ID do path sem verificar dono
    lines.forEach((line, idx) => {
      if ((line.includes("findUnique") || line.includes("findFirst")) && line.includes("params")) {
        // Pula se tem verificação de userId/owner
        const nextLines = lines.slice(idx, idx + 5).join(" ");
        if (!nextLines.includes("userId") && !nextLines.includes("owner") && !nextLines.includes("session.sub")) {
          findings.push({
            id: `idor-${file}-${idx}`.replace(/[^a-z0-9-]/gi, ""),
            category: "auth",
            file: relative(".", file),
            line: idx + 1,
            severity: "critical",
            rule: "Potential IDOR",
            description: `Query por ID sem verificar se o usuário é dono do recurso`,
            recommendation: "Após findUnique, valide: if (record.userId !== session.sub) return 403;",
          });
        }
      }
    });
  }

  const score = Math.max(0, 100 - findings.length * 12);
  const finishedAt = new Date().toISOString();
  return {
    category: "auth",
    startedAt,
    finishedAt,
    durationMs: Date.now() - t0,
    filesScanned: apiFiles.length,
    findings,
    score,
    summary: findings.length === 0 ? "Todas rotas têm auth" : `${findings.length} rota(s) sem auth ou com IDOR`,
  };
}

// ============ SCANNER 4: INPUT VALIDATION ============
function scanInput(): ScanResult {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const findings: Finding[] = [];
  const apiFiles = readDirRecursive("src/app/api");

  for (const file of apiFiles) {
    if (!file.endsWith("route.ts")) continue;
    const content = readFileSafe(file);
    if (!content) continue;

    const lines = content.split("\n");

    lines.forEach((line, idx) => {
      // Busca req.json() sem validação
      if (line.includes("await req.json()") || line.includes("await request.json()") || line.includes("req.json().catch")) {
        // Verifica se o arquivo inteiro tem Zod (importado e usado)
        const hasZod = content.includes('from "zod"') || content.includes("safeParse") || content.includes("schema.parse");
        if (!hasZod) {
          findings.push({
            id: `input-${file}-${idx}`.replace(/[^a-z0-9-]/gi, ""),
            category: "input",
            file: relative(".", file),
            line: idx + 1,
            severity: "medium",
            rule: "Missing Input Validation",
            description: "Body da requisição lido sem validação Zod",
            recommendation: "Use: const schema = z.object({...}); const data = schema.parse(body);",
          });
        }
      }

      // Busca dangerouslySetInnerHTML (XSS)
      if (line.includes("dangerouslySetInnerHTML")) {
        if (!line.includes("DOMPurify") && !line.includes("sanitize")) {
          findings.push({
            id: `xss-${file}-${idx}`.replace(/[^a-z0-9-]/gi, ""),
            category: "input",
            file: relative(".", file),
            line: idx + 1,
            severity: "high",
            rule: "Potential XSS",
            description: "dangerouslySetInnerHTML sem sanitização DOMPurify",
            recommendation: "Use: DOMPurify.sanitize(html) antes de renderizar",
          });
        }
      }
    });

    // Verifica upload sem checar tipo de arquivo
    if (content.includes("formData") && content.includes("file")) {
      if (!content.includes("mimetype") && !content.includes("filetype") && !content.includes("allowedTypes")) {
        findings.push({
          id: `upload-${file}`.replace(/[^a-z0-9-]/gi, ""),
          category: "input",
          file: relative(".", file),
          line: 0,
          severity: "high",
          rule: "Unrestricted File Upload",
          description: "Upload de arquivo sem validar tipo MIME",
          recommendation: "Valide: if (!['image/jpeg','image/png'].includes(file.type)) return 400;",
        });
      }
    }
  }

  const score = Math.max(0, 100 - findings.length * 8);
  const finishedAt = new Date().toISOString();
  return {
    category: "input",
    startedAt,
    finishedAt,
    durationMs: Date.now() - t0,
    filesScanned: apiFiles.length,
    findings,
    score,
    summary: findings.length === 0 ? "Inputs validados" : `${findings.length} problema(s) de validação`,
  };
}

// ============ SCANNER 5: RATE LIMITING ============
function scanRateLimit(): ScanResult {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const findings: Finding[] = [];
  const apiFiles = readDirRecursive("src/app/api");

  // Rotas que PRECISAM de rate limit
  const SENSITIVE_PATTERNS = [
    { pattern: "api/auth/login", name: "Login", severity: "critical" as Severity },
    { pattern: "api/auth/register", name: "Register", severity: "high" as Severity },
    { pattern: "api/auth/forgot-password", name: "Forgot Password", severity: "critical" as Severity },
    { pattern: "api/auth/reset-password", name: "Reset Password", severity: "high" as Severity },
    { pattern: "api/sync", name: "Sync", severity: "medium" as Severity },
    { pattern: "api/feedback", name: "Feedback", severity: "medium" as Severity },
    { pattern: "api/referral/register", name: "Referral Register", severity: "high" as Severity },
    { pattern: "api/quiz/submit", name: "Quiz Submit", severity: "medium" as Severity },
  ];

  for (const { pattern, name, severity } of SENSITIVE_PATTERNS) {
    const matching = apiFiles.filter((f) => f.includes(pattern));
    if (matching.length === 0) continue;

    for (const file of matching) {
      const content = readFileSafe(file);
      if (!content) continue;
      if (content.includes("applyRateLimit") || content.includes("rateLimit") || content.includes("rate-limit")) continue;

      findings.push({
        id: `ratelimit-${file}`.replace(/[^a-z0-9-]/gi, ""),
        category: "ratelimit",
        file: relative(".", file),
        line: 0,
        severity,
        rule: `No Rate Limit on ${name}`,
        description: `Rota sensível (${name}) sem rate limiting`,
        recommendation: "Adicione: const limited = await applyRateLimit(req, { windowMs: 60000, maxRequests: 5 });",
      });
    }
  }

  const score = Math.max(0, 100 - findings.length * 10);
  const finishedAt = new Date().toISOString();
  return {
    category: "ratelimit",
    startedAt,
    finishedAt,
    durationMs: Date.now() - t0,
    filesScanned: apiFiles.length,
    findings,
    score,
    summary: findings.length === 0 ? "Rate limit OK" : `${findings.length} rota(s) sem rate limit`,
  };
}

// ============ ORQUESTRADOR ============
const SCANNERS: Record<ScanCategory, () => ScanResult> = {
  secrets: scanSecrets,
  rls: scanRLS,
  auth: scanAuth,
  input: scanInput,
  ratelimit: scanRateLimit,
};

export function runSingleScan(category: ScanCategory): ScanResult {
  return SCANNERS[category]();
}

export function runFullScan(): FullScanResult {
  const id = `scan-${Date.now()}`;
  const startedAt = new Date().toISOString();
  const t0 = Date.now();

  const results: Record<ScanCategory, ScanResult> = {
    secrets: runSingleScan("secrets"),
    rls: runSingleScan("rls"),
    auth: runSingleScan("auth"),
    input: runSingleScan("input"),
    ratelimit: runSingleScan("ratelimit"),
  };

  const totalFindings = Object.values(results).reduce((sum, r) => sum + r.findings.length, 0);
  const overallScore = Math.round(
    Object.values(results).reduce((sum, r) => sum + r.score, 0) / 5,
  );

  return {
    id,
    startedAt,
    finishedAt: new Date().toISOString(),
    durationMs: Date.now() - t0,
    results,
    totalFindings,
    overallScore,
  };
}

export const CATEGORY_INFO: Record<ScanCategory, { label: string; icon: string; description: string }> = {
  secrets: { label: "Segredos & Chaves", icon: "🔑", description: "Caça tokens, API keys e senhas hardcoded (estilo Gitleaks)" },
  rls: { label: "RLS & Banco", icon: "🛡️", description: "Row Level Security no Supabase/Postgres e service_role" },
  auth: { label: "Auth & IDOR", icon: "🔐", description: "Rotas sem auth e IDOR (ID sem checar dono)" },
  input: { label: "Input & XSS", icon: "🧹", description: "Validação de input, XSS e upload sem checar tipo" },
  ratelimit: { label: "Rate Limiting", icon: "⚡", description: "Rotas sensíveis sem rate limiting" },
};
