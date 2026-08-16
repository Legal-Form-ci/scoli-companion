/* Scoly PWA Service Worker — cache strategy tuned for slow mobile networks */
const VERSION = 'scoly-v3';
const STATIC_CACHE = `${VERSION}-static`;
const IMAGE_CACHE = `${VERSION}-images`;
const DATA_CACHE = `${VERSION}-data`;

const IMAGE_MAX_ENTRIES = 180;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(['/', '/manifest.json', '/placeholder.svg']).catch(() => undefined)
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((k) => cache.delete(k)));
}

/** Stale-while-revalidate: instant paint from cache, silent refresh in background. */
async function staleWhileRevalidate(request, cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        cache.put(request, response.clone());
        if (maxEntries) trimCache(cacheName, maxEntries);
      }
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (!url.protocol.startsWith('http')) return;

  // Never cache auth / realtime / API mutations
  if (url.pathname.includes('/auth/v1') || url.pathname.includes('/realtime/v1') || url.pathname.includes('/functions/v1')) {
    return;
  }

  const isImage =
    request.destination === 'image' ||
    /\.(png|jpe?g|webp|avif|gif|svg)$/i.test(url.pathname) ||
    url.pathname.includes('/storage/v1/object/public/');

  if (isImage) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE, IMAGE_MAX_ENTRIES));
    return;
  }

  if (request.destination === 'style' || request.destination === 'script' || request.destination === 'font') {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/').then((r) => r || Response.error()))
    );
    return;
  }

  if (url.pathname.includes('/rest/v1/')) {
    event.respondWith(
      fetch(request).catch(() => staleWhileRevalidate(request, DATA_CACHE, 60))
    );
  }
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
