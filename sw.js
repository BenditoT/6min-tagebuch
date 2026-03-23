// sw.js — Service Worker für 6-Minuten-Tagebuch PWA
// Phase 1 Quick Wins: CDN precache, Supabase-JS cache, POST/401 fix, Update-Notification

const CACHE_VERSION = 'v1.1.0';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// CDN-URLs die beim Install vorgeladen werden
const CDN_ASSETS = [
  'https://esm.sh/preact@10.19.3',
  'https://esm.sh/preact@10.19.3/hooks',
  'https://esm.sh/htm@3.1.1',
  'https://esm.sh/@supabase/supabase-js@2.45.0'
];

// ================== INSTALLATION ==================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v' + CACHE_VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // CDN-Assets separat cachen — bei Fehler trotzdem installieren
        return caches.open(STATIC_CACHE).then(cache => {
          return Promise.allSettled(
            CDN_ASSETS.map(url =>
              fetch(url).then(resp => {
                if (resp.ok) {
                  cache.put(url, resp);
                  console.log('[SW] Cached CDN:', url.substring(0, 60));
                }
              }).catch(err => console.warn('[SW] CDN cache skip:', url.substring(0, 40), err.message))
            )
          );
        });
      })
      // Nicht sofort skipWaiting — warte auf Message vom Client
      .catch(err => console.error('[SW] Install failed:', err))
  );
});

// ================== ACTIVATION ==================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v' + CACHE_VERSION);
  event.waitUntil(
    caches.keys()
      .then(cacheNames => Promise.all(
        cacheNames
          .filter(name => !name.includes(CACHE_VERSION))
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      ))
      .then(() => self.clients.claim())
  );
});

// ================== MESSAGE HANDLER ==================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting requested by client');
    self.skipWaiting();
  }
});

// ================== FETCH ==================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (!url.protocol.startsWith('http')) return;

  // Mutations (POST/PUT/DELETE/PATCH) NIEMALS cachen — immer direkt ans Netzwerk
  if (request.method !== 'GET') {
    event.respondWith(fetch(request).catch(() =>
      new Response(JSON.stringify({ error: 'Offline — Aktion nicht möglich' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      })
    ));
    return;
  }

  // Supabase API: Network-first (immer aktuelle Daten), aber 401/403 nicht cachen
  if (url.hostname.includes('supabase')) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
    return;
  }

  // CDN-Assets (esm.sh, jsdelivr): Cache-first (stabil, versioniert)
  if (url.hostname === 'esm.sh' || url.hostname === 'cdn.jsdelivr.net') {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Eigene Assets: Cache-first mit Network-Fallback
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Alles andere: Network-first
  event.respondWith(networkFirst(request, RUNTIME_CACHE));
});

// ================== STRATEGIEN ==================

async function cacheFirst(request, cacheName) {
  try {
    const cached = await caches.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);

    // Auth-Fehler NICHT cachen — sonst zeigt Offline immer 401
    if (response.status === 401 || response.status === 403) {
      return response;
    }

    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
