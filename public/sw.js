// Service Worker do MeuCorre — PWA offline-first.
// Cacheia o app shell para funcionar sem internet (garagens, subsolos, etc.).
//
// ESTRATÉGIA DE CACHE (Fase 3 — Achado #1 corrigido):
// - App shell (HTML, JS, CSS, imagens estáticas): stale-while-revalidate
// - /api/*: NUNCA intercepta — sempre vai direto ao servidor.
//   Razão: rotas API retornam dados sensíveis do usuário logado e devem
//   ser sempre frescas. Antes da correção, GET /api/sync retornava 200
//   em cache mesmo após logout, expondo dados stale do usuário anterior.
// - _next/data/*: NUNCA intercepta (rotas dinâmicas do Next.js que
//   podem conter dados sensíveis).

const CACHE_NAME = "meucorre-v4"; // bumped: v3 → v4 força update do SW e limpa cache antigo
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

// Ativa: limpa caches antigos
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

// Fetch: stale-while-revalidate para app shell; bypass para API
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Só processa GET
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Não intercepta requisições cross-origin (CDNs do Next, fonts, etc.)
  if (url.origin !== self.location.origin) return;

  // CRÍTICO: não intercepta rotas API nem dados dinâmicos do Next.js.
  // Sem isso, GET /api/sync retornava 200 em cache mesmo após logout,
  // expondo dados stale do usuário anterior (Achado #1 da Fase 2).
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/data/")
  ) {
    return; // deixa o browser fazer a request normal (sem cache do SW)
  }

  // Estratégia: stale-while-revalidate para o app shell (HTML, JS, CSS, imgs)
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          // Só faz cache de respostas válidas
          if (res && res.status === 200 && res.type === "basic") {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached); // offline: retorna o cache
      return cached || fetchPromise;
    }),
  );
});

// Permite pular espera (update imediato)
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
