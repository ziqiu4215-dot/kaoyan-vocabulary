const CACHE = 'yanci-v3';
const OFFLINE_URL = '/offline.html';

// Pre-cache the offline page on install
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // For navigation requests (HTML pages), return offline page
        if (e.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
        // For other resources, return cached or 503
        return cached || new Response('Offline', { status: 503 });
      });

      // Return cached immediately, update from network in background
      return cached || fetchPromise;
    }),
  );
});
