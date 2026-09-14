/**
 * Service Worker for Zella Portfolio
 * Caches static assets for faster repeat visits
 */

const CACHE_NAME = 'zella-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/designer.html',
  '/artist.html',
  '/styles.css',
  '/script.js',
  '/fluid-effect.js',
  '/liquid-border.js',
  '/assets/fonts/Helvetica.ttf',
  '/assets/fonts/Helvetica-Bold.ttf',
  '/assets/images/zella-logo.png'
];

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request)
      .then((cached) => {
        // Return cached version or fetch from network
        const fetched = fetch(event.request)
          .then((response) => {
            // Cache successful responses
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => cached); // Fall back to cache if offline

        return cached || fetched;
      })
  );
});
