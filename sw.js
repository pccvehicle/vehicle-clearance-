const CACHE_NAME = 'vehicle-clearance-cache-v1';

// ====================================================================
// FIX: Only cache files from your own domain.
// Third-party scripts (Tailwind, jsPDF, etc.) are removed.
// The browser will handle caching those separately.
// ====================================================================
const urlsToCache = [
  './', // This caches the root URL of your site
  'index.html',
  'sw-register.js',
  'car_logo.jpg',
  'userguide.html'
];

// Install a service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Failed to cache one or more resources:', err);
      })
  );
});

// Cache and return requests
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Update a service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

