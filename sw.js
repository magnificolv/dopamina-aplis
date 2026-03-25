const CACHE_NAME = 'dopamina-aplis-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg'
];

// Install - cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', event => {
  // Skip non-GET and CDN requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // For CDN resources (Three.js, fonts), use cache-first
  if (url.hostname !== location.hostname) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // For local resources, network-first
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
