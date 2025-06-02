// FinanceOS Service Worker
// Handles offline functionality, caching, and background sync

const CACHE_NAME = 'financeos-v2.0.0';
const STATIC_CACHE = 'financeos-static-v2.0.0';
const DYNAMIC_CACHE = 'financeos-dynamic-v2.0.0';
const CSV_CACHE = 'financeos-csv-v1.0.0';

// Files to cache immediately (App Shell)
const STATIC_FILES = [
  '/',
  '/index.html',
  '/csv-upload.html',
  '/goals.html',
  '/styles.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add other essential assets
];

// Dynamic files that can be cached on request
const DYNAMIC_FILES = [
  '/icons/',
  '/screenshots/',
  // API responses, user data, etc.
];

// Install Event - Cache App Shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching App Shell');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('[SW] App Shell cached successfully');
        return self.skipWaiting(); // Force activation
      })
      .catch((error) => {
        console.error('[SW] Error caching app shell:', error);
      })
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old versions of caches
              return cacheName !== STATIC_CACHE && 
                     cacheName !== DYNAMIC_CACHE && 
                     cacheName !== CSV_CACHE &&
                     cacheName.startsWith('financeos-');
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim(); // Take control of pages
      })
  );
});

// Fetch Event - Handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (isAPIRequest(request)) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  } else if (isCSVUpload(request)) {
    event.respondWith(handleCSVUpload(request));
  } else {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
  }
});

// Background Sync - Handle offline CSV uploads
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'csv-upload-sync') {
    event.waitUntil(syncPendingCSVUploads());
  } else if (event.tag === 'goal-update-sync') {
    event.waitUntil(syncPendingGoalUpdates());
  } else if (event.tag === 'transaction-sync') {
    event.waitUntil(syncPendingTransactions());
  }
});

// Message Handler - Communication with main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches()
        .then(() => event.ports[0].postMessage({ success: true }))
        .catch((error) => event.ports[0].postMessage({ error: error.message }));
      break;
      
    case 'CACHE_CSV_DATA':
      cacheCSVData(data)
        .then(() => event.ports[0].postMessage({ success: true }))
        .catch((error) => event.ports[0].postMessage({ error: error.message }));
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Push Notification Handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let notificationData = {
    title: 'FinanceOS',
    body: 'You have a new financial notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'financeos-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'View Dashboard',
        icon: '/icons/dashboard-96x96.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/close-96x96.png'
      }
    ]
  };
  
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...notificationData, ...pushData };
    } catch (error) {
      console.error('[SW] Error parsing push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  const action = event.action || 'view';
  let url = '/';
  
  switch (action) {
    case 'view':
      url = '/';
      break;
    case 'upload':
      url = '/csv-upload.html';
      break;
    case 'goals':
      url = '/goals.html';
      break;
    default:
      url = '/';
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// =============================================
// CACHING STRATEGIES
// =============================================

// Cache First Strategy - For static assets
function cacheFirst(request, cacheName) {
  return caches.open(cacheName)
    .then((cache) => {
      return cache.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            });
        });
    })
    .catch(() => {
      // Return offline fallback if available
      return caches.match('/offline.html');
    });
}

// Network First Strategy - For API requests
function networkFirst(request, cacheName) {
  return fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        return caches.open(cacheName)
          .then((cache) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });
      }
      return networkResponse;
    })
    .catch(() => {
      return caches.open(cacheName)
        .then((cache) => {
          return cache.match(request);
        });
    });
}

// Stale While Revalidate - For dynamic content
function staleWhileRevalidate(request, cacheName) {
  return caches.open(cacheName)
    .then((cache) => {
      return cache.match(request)
        .then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            });
          
          return cachedResponse || fetchPromise;
        });
    });
}

// =============================================
// HELPER FUNCTIONS
// =============================================

function isStaticAsset(request) {
  const url = new URL(request.url);
  return STATIC_FILES.includes(url.pathname) ||
         url.pathname.includes('/icons/') ||
         url.pathname.includes('/styles.css') ||
         url.pathname.includes('/manifest.json');
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/');
}

function isCSVUpload(request) {
  return request.method === 'POST' && 
         request.url.includes('csv') ||
         request.url.includes('upload');
}

// =============================================
// CSV AND DATA HANDLING
// =============================================

function handleCSVUpload(request) {
  // Try network first for uploads
  return fetch(request)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network request failed');
      }
      return response;
    })
    .catch(() => {
      // Store for background sync if offline
      return storeForBackgroundSync(request, 'csv-upload');
    });
}

function storeForBackgroundSync(request, type) {
  return request.clone().text()
    .then((body) => {
      const syncData = {
        url: request.url,
        method: request.method,
        headers: [...request.headers.entries()],
        body: body,
        timestamp: Date.now(),
        type: type
      };
      
      return addToIndexedDB('pending-sync', syncData)
        .then(() => {
          return self.registration.sync.register(`${type}-sync`);
        })
        .then(() => {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'Stored for background sync',
              offline: true 
            }),
            { 
              status: 202, 
              headers: { 'Content-Type': 'application/json' } 
            }
          );
        });
    });
}

function syncPendingCSVUploads() {
  return getAllFromIndexedDB('pending-sync')
    .then((pendingRequests) => {
      const csvUploads = pendingRequests.filter(req => req.type === 'csv-upload');
      
      return Promise.all(
        csvUploads.map((syncData) => {
          const request = new Request(syncData.url, {
            method: syncData.method,
            headers: new Headers(syncData.headers),
            body: syncData.body
          });
          
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                return removeFromIndexedDB('pending-sync', syncData.id);
              }
              throw new Error('Sync failed');
            })
            .catch((error) => {
              console.error('[SW] CSV sync failed:', error);
              // Keep in queue for next sync attempt
            });
        })
      );
    });
}

function syncPendingGoalUpdates() {
  // Similar to CSV sync but for goal updates
  return getAllFromIndexedDB('pending-sync')
    .then((pendingRequests) => {
      const goalUpdates = pendingRequests.filter(req => req.type === 'goal-update');
      
      return Promise.all(
        goalUpdates.map((syncData) => {
          // Process goal update sync
          return processGoalSync(syncData);
        })
      );
    });
}

function syncPendingTransactions() {
  // Sync any pending transaction updates
  return getAllFromIndexedDB('pending-sync')
    .then((pendingRequests) => {
      const transactions = pendingRequests.filter(req => req.type === 'transaction');
      
      return Promise.all(
        transactions.map((syncData) => {
          return processTransactionSync(syncData);
        })
      );
    });
}

function cacheCSVData(data) {
  return caches.open(CSV_CACHE)
    .then((cache) => {
      const response = new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      });
      return cache.put('/csv-data', response);
    });
}

// =============================================
// INDEXEDDB HELPERS
// =============================================

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FinanceOSDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pending-sync')) {
        const store = db.createObjectStore('pending-sync', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('csv-data')) {
        db.createObjectStore('csv-data', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('goals')) {
        db.createObjectStore('goals', { keyPath: 'id' });
      }
    };
  });
}

function addToIndexedDB(storeName, data) {
  return openIndexedDB()
    .then((db) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(data);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    });
}

function getAllFromIndexedDB(storeName) {
  return openIndexedDB()
    .then((db) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    });
}

function removeFromIndexedDB(storeName, id) {
  return openIndexedDB()
    .then((db) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
      });
    });
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

function clearAllCaches() {
  return caches.keys()
    .then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('financeos-'))
          .map((cacheName) => caches.delete(cacheName))
      );
    });
}

function processGoalSync(syncData) {
  // Implementation for syncing goal updates
  return fetch(new Request(syncData.url, {
    method: syncData.method,
    headers: new Headers(syncData.headers),
    body: syncData.body
  }));
}

function processTransactionSync(syncData) {
  // Implementation for syncing transaction updates
  return fetch(new Request(syncData.url, {
    method: syncData.method,
    headers: new Headers(syncData.headers),
    body: syncData.body
  }));
}

// Log service worker status
console.log('[SW] FinanceOS Service Worker loaded successfully');
console.log('[SW] Cache version:', CACHE_NAME);
console.log('[SW] Static files to cache:', STATIC_FILES.length);