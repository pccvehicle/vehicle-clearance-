// This script handles saving clearance requests when the app is offline
// and registering a background sync event to send them later.

// A simple IndexedDB wrapper library
const idb = {
  db: null,
  async open(name, version, upgradeCallback) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(name, version);
      request.onupgradeneeded = (event) => {
        this.db = event.target.result;
        if (upgradeCallback) {
          upgradeCallback(this.db);
        }
      };
      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };
      request.onerror = (event) => {
        reject('IndexedDB error: ' + event.target.errorCode);
      };
    });
  },
  async add(storeName, item) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(item);
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject('Error adding item: ' + event.target.error);
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

// --- Background Sync Logic ---

const DB_NAME = 'vehicle-clearance-db';
const DB_VERSION = 1;
const STORE_NAME = 'offline-requests';

// Initialize the database
idb.open(DB_NAME, DB_VERSION, (db) => {
  if (!db.objectStoreNames.contains(STORE_NAME)) {
    db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
  }
});

/**
 * Saves a clearance request payload to IndexedDB for later syncing.
 * @param {object} requestPayload The data object for the clearance request.
 */
async function saveRequestForSync(requestPayload) {
  try {
    // Add a timestamp for reference
    requestPayload.savedOfflineAt = new Date().toISOString();
    await idb.add(STORE_NAME, requestPayload);
    console.log('Request saved for background sync.');
  } catch (error) {
    console.error('Could not save request for sync:', error);
  }
}

/**
 * Registers a 'sync' event with the service worker.
 * The service worker will fire this event when connectivity is restored.
 */
async function registerBackgroundSync() {
  if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
    console.warn('Background Sync is not supported.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.sync.register('sync-clearance-requests');
    console.log('Background sync registered.');
  } catch (error) {
    console.error('Background sync registration failed:', error);
  }
}