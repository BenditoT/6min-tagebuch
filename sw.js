// sw.js — Service Worker für 6-Minuten-Tagebuch PWA
// v2.2.1: iOS Gallery-Fix (capture-Attribut entfernt für Galerie-Zugriff)

const CACHE_VERSION = 'v2.2.1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-180.png',
  '/icon-192.png',
  '/icon-512.png'
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
        // Resilient: einzeln cachen statt addAll (ein fehlender Asset blockt nicht alles)
        return Promise.allSettled(
          STATIC_ASSETS.map(url =>
            fetch(url).then(resp => { if (resp.ok) return cache.put(url, resp); })
              .catch(err => console.warn('[SW] Static asset failed:', url, err))
          )
        );
      })
      .then(() => {
        // CDN-Assets separat — bei Fehler trotzdem installieren
        return caches.open(STATIC_CACHE).then(cache => {
          return Promise.allSettled(
            CDN_ASSETS.map(url =>
              fetch(url).then(resp => {
                if (resp.ok) cache.put(url, resp);
              }).catch(() => {})
            )
          );
        });
      })
      // Sofort aktivieren damit neue Versionen immer durchkommen
      .then(() => { console.log('[SW] Install complete, activating immediately'); self.skipWaiting(); })
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
      .then(() => {
        // Alle Clients über Update informieren
        return self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION }));
        });
      })
  );
});

// ================== MESSAGE HANDLER ==================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ================== FETCH ==================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (!url.protocol.startsWith('http')) return;

  // Mutations (POST/PUT/DELETE/PATCH) NIEMALS cachen
  if (request.method !== 'GET') {
    event.respondWith(fetch(request).catch(() =>
      new Response(JSON.stringify({ error: 'Offline' }), {
        status: 503, headers: { 'Content-Type': 'application/json' }
      })
    ));
    return;
  }

  // Supabase API: Network-first, 401/403 nicht cachen
  if (url.hostname.includes('supabase')) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
    return;
  }

  // CDN-Assets (esm.sh, jsdelivr): Cache-first (stabil, versioniert)
  if (url.hostname === 'esm.sh' || url.hostname === 'cdn.jsdelivr.net') {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Hauptdokument (HTML): NETWORK-FIRST (verhindert Race Condition bei SPA-Updates)
  if (request.destination === 'document' || request.mode === 'navigate') {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }

  // Eigene Sub-Resources (Icons, manifest, etc.): STALE-WHILE-REVALIDATE
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
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
    const response = await fetch(request, { redirect: 'follow' });
    // Nur finale Responses cachen (keine 302-Redirects)
    if (response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.status === 401 || response.status === 403) return response;
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503, headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Im Hintergrund die neueste Version holen
  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);

  // Wenn Cache vorhanden: sofort liefern, Hintergrund-Update läuft
  // Wenn kein Cache: auf Netzwerk warten
  return cached || fetchPromise;
}
