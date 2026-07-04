// HomeSync Service Worker — v1.1
// Strategia: Cache-first per assets statici, Network-first per /api
// NB: bumpare CACHE_NAME a OGNI deploy che cambia gli asset, altrimenti l'app
// installata continua a servire i vecchi file dalla cache (stale-while-revalidate).

const CACHE_NAME = 'homesync-v1-v11';
const API_CACHE  = 'homesync-api-v1';

// Assets da precachare al primo install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/runtime-config.json',
  '/lib/tokens.jsx',
  '/lib/icons.jsx',
  '/lib/primitives.jsx',
  '/lib/task-cards.jsx',
  '/lib/nav-and-quickadd.jsx',
  '/lib/screens.jsx',
  '/lib/task-detail.jsx',
  '/lib/who-did-it.jsx',
  '/lib/drawer.jsx',
  '/lib/member-and-history.jsx',
  '/lib/invite.jsx',
  '/lib/settings.jsx',
  '/lib/desktop.jsx',
  '/lib-bridge/api-client.js',
  '/lib-bridge/user-picker.js',
  // Google Fonts (served from network, but we try to cache)
  'vendor/react.min.js',
  'vendor/react-dom.min.js',
  'vendor/babel.min.js'
];

// CDN assets: cache opportunistica (non blocca installazione)


// ─── Install ─────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Precache app assets (ignora errori singoli)
      return Promise.allSettled(
        PRECACHE_ASSETS.map(url =>
          cache.add(url).catch(e => console.warn('[SW] precache fail:', url, e.message))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== API_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // /api/* → Network only (mai cache, dati sempre freschi)
  if (url.pathname.startsWith('/api')) {
    return;
  }

  // Vendor React/Babel: cached locally via PRECACHE_ASSETS. Google Fonts: non intercettare.
  // Il SW fetcherebbe via connect-src, che la CSP limita a 'self' -> verrebbero
  // bloccate (503) e l'app installata non monterebbe. Lasciandole al browser,
  // passano da script-src/style-src (che le consentono) e funzionano.
  if (url.origin !== self.location.origin) {
    return;
  }

  // HTML pages → Network first, fallback to cache
  if (url.pathname === '/' || url.pathname === '/index.html' || !url.pathname.startsWith('/lib')) {
    event.respondWith(networkFirstWithCache(event.request, CACHE_NAME, 4000));
    return;
  }

  // JSX/static assets → Cache first, then network (stale-while-revalidate)
  event.respondWith(staleWhileRevalidate(event.request, CACHE_NAME));
});

// ─── Strategies ──────────────────────────────────────────────────────────────

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
    return new Response('Offline — risorsa non disponibile', { status: 503 });
  }
}

async function networkFirstWithCache(request, cacheName, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeout);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    clearTimeout(timeout);
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ error: 'offline' }), {
      status: 503, headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);

  return cached || await networkPromise || new Response('Offline', { status: 503 });
}

// ─── Push notifications ───────────────────────────────────────────────────────
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || 'Hai task pendenti oggi!',
    icon: '/favicon.png',
    badge: '/icon.svg',
    tag: data.tag || 'homesync',
    data: data.url || '/',
    actions: [
      { action: 'open', title: 'Apri HomeSync' },
      { action: 'dismiss', title: 'Ignora' },
    ],
    vibrate: [100, 50, 100],
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'HomeSync', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      const client = windowClients.find(c => c.url === self.location.origin + '/');
      if (client) return client.focus();
      return clients.openWindow('/');
    })
  );
});
