// Service Worker do MeuCorre — PWA offline-first.
// Cacheia o app shell para funcionar sem internet (garagens, subsolos, etc.).

const CACHE_NAME = "meucorre-v1";
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

// Fetch: stale-while-revalidate para app shell; network-first para API/dados dinâmicos
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Só processa GET
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Não intercepta requisições cross-origin (CDNs do Next, fonts, etc.)
  if (url.origin !== self.location.origin) return;

  // Estratégia: stale-while-revalidate para o app shell
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
