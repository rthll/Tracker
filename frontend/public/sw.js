const CACHE_VERSION = 'v1';
const SHELL_CACHE   = `tracker-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `tracker-runtime-${CACHE_VERSION}`;

// Pré-cachear na instalação: shell mínimo + dados TACO (arquivo grande, nunca muda)
const PRECACHE = ['/', '/data/taco-alimentos.js'];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const valid = new Set([SHELL_CACHE, RUNTIME_CACHE]);
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => !valid.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // API — sempre rede, nunca cachear
  if (url.pathname.startsWith('/api/')) return;

  // Dados TACO e outros assets em /data/ — cache-first (imutáveis)
  if (url.origin === self.location.origin && url.pathname.startsWith('/data/')) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
    return;
  }

  // index.html / navegação SPA — network-first para pegar atualizações,
  // cai no cache offline se sem conexão
  if (
    url.origin === self.location.origin &&
    (url.pathname === '/' || request.headers.get('accept')?.includes('text/html'))
  ) {
    event.respondWith(networkFirst(request, SHELL_CACHE));
    return;
  }

  // Assets da origem (CSS, JS, ícones) — stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }

  // Recursos externos (Google Fonts, Bootstrap CDN) — stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

// ── Estratégias de cache ──────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Recurso indisponível offline.', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached ?? new Response(
      '<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Offline</title>' +
      '<meta name="viewport" content="width=device-width,initial-scale=1"></head>' +
      '<body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">' +
      '<div style="text-align:center"><h2>Sem conexão</h2>' +
      '<p>Abra o app novamente quando tiver internet.</p></div></body></html>',
      { status: 503, headers: { 'Content-Type': 'text/html;charset=utf-8' } }
    );
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  return cached ?? (await fetchPromise) ?? new Response('Offline', { status: 503 });
}
