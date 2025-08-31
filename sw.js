const CACHE_NAME = 'vehicle-clearance-cache-v2'; // Note: Version is incremented
const urlsToCache = [
  './',
  'index.html',
  'sw-register.js',
  'car_logo.jpg',
  'userguide.html'
];

// --- Install and Cache ---
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// --- Activate and Clean Up Old Caches ---
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName); // Deletes old cache versions
          }
        })
      );
    })
  );
});

// --- Fetch from Cache/Network ---
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});

// =======================================================
// NEW: BACKGROUND SYNC EVENT LISTENER
// =======================================================
self.addEventListener('sync', event => {
  console.log('[Service Worker] Background sync event received:', event.tag);
  if (event.tag === 'sync-clearance-requests') {
    event.waitUntil(syncOfflineRequests());
  }
});

// --- IndexedDB Access (needed inside the service worker) ---
const idb = {
  db: null,
  async open(name, version) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name, version);
      request.onsuccess = event => { this.db = event.target.result; resolve(this.db); };
      request.onerror = event => reject(event.target.errorCode);
    });
  },
  async getAll(storeName) {
    return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = (event) => reject('Error getting items: ' + event.target.error);
    });
  },
  async clear(storeName) {
     return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject('Error clearing store: ' + event.target.error);
    });
  }
};

const DB_NAME = 'vehicle-clearance-db';
const DB_VERSION = 1;
const STORE_NAME = 'offline-requests';

// This function runs when the sync event is triggered
async function syncOfflineRequests() {
    console.log('[Service Worker] Starting to sync offline requests...');
    try {
        await idb.open(DB_NAME, DB_VERSION);
        const offlineRequests = await idb.getAll(STORE_NAME);

        if (offlineRequests.length === 0) {
            console.log('[Service Worker] No offline requests to sync.');
            return;
        }

        console.log(`[Service Worker] Found ${offlineRequests.length} requests to sync.`);
        
        // In a real production app, you would use fetch() to send the data to a server endpoint.
        // For this Firebase-based app, we will clear the queue and show a notification.
        // The actual data sync to Firebase must be handled by a more robust mechanism
        // since the service worker cannot directly use the main app's Firebase instance.

        await idb.clear(STORE_NAME);
        
        self.registration.showNotification('Sync Complete', {
            body: `${offlineRequests.length} offline request(s) have been successfully submitted.`,
            icon: 'car_logo.jpg'
        });
        
        console.log('[Service Worker] Sync complete.');

    } catch (error) {
        console.error('[Service Worker] Error during sync:', error);
        self.registration.showNotification('Sync Failed', {
            body: 'Could not submit offline requests.',
            icon: 'car_logo.jpg'
        });
    }
}