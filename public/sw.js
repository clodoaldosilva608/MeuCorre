// Service Worker do MeuCorre — PWA offline-first.
// Cacheia o app shell para funcionar sem internet (garagens, subsolos, etc.).
//
// ESTRATÉGIA DE CACHE:
// - Navegação (HTML pages): NETWORK-FIRST
//   Tenta buscar a versão mais recente do servidor. Só usa cache se offline.
//   Isto garante que mudanças no código (ex: remoção da dashboard legacy)
//   sejam visíveis IMEDIATAMENTE ao recarregar — sem precisar de um segundo
//   reload para ver a nova versão.
// - Assets estáticos (JS, CSS, imagens): STALE-WHILE-REVALIDATE
//   Serve do cache para carregamento rápido, atualiza em background.
// - /api/*: NUNCA intercepta — sempre vai direto ao servidor.
// - _next/data/*: NUNCA intercepta (rotas dinâmicas do Next.js).

const CACHE_NAME = "meucorre-v5"; // bumped: v4 → v5 força limpeza de cache antigo
const APP_SHELL = [
  "/",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
];

// Instala: pré-cacheia o app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn("[SW] cache addAll falhou:", err)),
  );
});

// Ativa: limpa caches antigos e assume controle imediatamente
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// Fetch handler
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Só processa GET
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Não intercepta requisições cross-origin (CDNs do Next, fonts, etc.)
  if (url.origin !== self.location.origin) return;

  // CRÍTICO: não intercepta rotas API nem dados dinâmicos do Next.js.
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/data/")
  ) {
    return; // deixa o browser fazer a request normal (sem cache do SW)
  }

  // ===== Navegação (HTML pages): NETWORK-FIRST =====
  // Garante que o usuário sempre veja a versão mais recente do HTML.
  // Só cai para cache se estiver offline.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Sucesso — atualiza o cache e retorna a resposta fresca
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => {
          // Offline — retorna o HTML em cache (última versão vista)
          return caches.match(req).then((cached) => {
            return cached || caches.match("/");
          });
        }),
    );
    return;
  }

  // ===== Assets estáticos (JS, CSS, imagens): STALE-WHILE-REVALIDATE =====
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    }),
  );
});

// Permite pular espera (update imediato)
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
