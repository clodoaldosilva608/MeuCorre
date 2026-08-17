// ===== Cliente OAuth da Kiwify =====
//
// Documentação: https://docs.kiwify.com.br/api-reference/general
//
// Fluxo de autenticação:
// 1. POST https://public-api.kiwify.com/v1/oauth/token
//    Content-Type: application/x-www-form-urlencoded
//    Body: client_id=...&client_secret=...
//    → retorna { access_token, token_type, expires_in, scope }
//
// 2. Chamadas autenticadas:
//    Authorization: Bearer <access_token>
//    x-kiwify-account-id: <account_id>  // é o "store_id" do JWT, NÃO o client_id
//
// IMPORTANTE:
// - access_token expira em 24h (96h segundo docs, mas JWT mostra 24h)
// - account_id é o campo "store_id" do JWT decodificado
// - Em muitos casos, account_id == KIWIFY_WEBHOOK_SECRET (mesmo valor)

const KIWIFY_API_BASE = "https://public-api.kiwify.com/v1";

interface TokenCache {
  token: string;
  expiresAt: number; // timestamp ms
}

let tokenCache: TokenCache | null = null;
const SAFETY_MARGIN_MS = 60 * 60 * 1000; // renova 1h antes de expirar

export interface KiwifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string[];
}

/**
 * Obtém um access_token OAuth válido da Kiwify.
 * Usa cache em memória para evitar chamadas repetidas.
 * Token expira em 24h, renovamos em 23h por segurança.
 */
export async function getKiwifyAccessToken(): Promise<string | null> {
  // Verificar cache
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const clientId = process.env.KIWIFY_CLIENT_ID;
  const clientSecret = process.env.KIWIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn("[kiwify] KIWIFY_CLIENT_ID ou KIWIFY_CLIENT_SECRET não configurados");
    return null;
  }

  try {
    const res = await fetch(`${KIWIFY_API_BASE}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[kiwify] OAuth falhou:", err);
      return null;
    }

    const data = (await res.json()) as KiwifyToken;
    const accessToken = data.access_token;

    if (!accessToken) {
      console.error("[kiwify] Token não retornado:", data);
      return null;
    }

    // Calcular expiração (default 24h)
    const expiresInSec = data.expires_in || 86400;
    const expiresAtMs = Date.now() + expiresInSec * 1000 - SAFETY_MARGIN_MS;

    tokenCache = {
      token: accessToken,
      expiresAt: expiresAtMs,
    };

    console.log(`[kiwify] Token OAuth obtido, expira em ${expiresInSec}s`);
    return accessToken;
  } catch (error) {
    console.error("[kiwify] Erro no OAuth:", error);
    return null;
  }
}

/**
 * Retorna o account_id (store_id) da Kiwify.
 * Em muitos casos é o mesmo valor que KIWIFY_WEBHOOK_SECRET.
 * Pode ser configurado separadamente em KIWIFY_ACCOUNT_ID.
 */
export function getKiwifyAccountId(): string {
  return (
    process.env.KIWIFY_ACCOUNT_ID ||
    process.env.KIWIFY_WEBHOOK_SECRET ||
    ""
  );
}

/**
 * Faz uma chamada autenticada para a API da Kiwify.
 * Adiciona automaticamente os headers Authorization e x-kiwify-account-id.
 */
export async function kiwifyFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getKiwifyAccessToken();
  if (!token) {
    throw new Error("Falha ao obter token OAuth da Kiwify");
  }

  const accountId = getKiwifyAccountId();

  const url = path.startsWith("http")
    ? path
    : `${KIWIFY_API_BASE}${path}`;

  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "x-kiwify-account-id": accountId,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}

/**
 * Limpa o cache do token (útil para testes ou se o token for invalidado).
 */
export function clearKiwifyTokenCache(): void {
  tokenCache = null;
}
