// FinanceOS Service Worker
// Handles caching, offline functionality, and background sync

const CACHE_NAME = 'financeos-v1.0.0';
const STATIC_CACHE = 'financeos-static-v1.0.0';
const DYNAMIC_CACHE = 'financeos-dynamic-v1.0.0';

// Files to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/csv-upload.html',
  '/goals.html',
  '/styles.css',
  '/data-manager.js',
  '/notification-system.js',
  '/manifest.json',
  
  // Icons
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
  
  // Fonts (if any)
  // Add font files here if using custom fonts
];

// Cache strategies for different resource types
const CACHE_STRATEGIES = {
  pages: 'networkFirst',
  scripts: 'staleWhileRevalidate',
  styles: 'staleWhileRevalidate',
  images: 'cacheFirst',
  api: 'networkFirst'
};

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE)
        .then(cache => {
          console.log('[SW] Caching static assets');
          return cache.addAll(STATIC_ASSETS);
        }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Claim all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different resource types
  if (isHTMLPage(request)) {
    event.respondWith(handlePageRequest(request));
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else {
    event.respondWith(handleOtherRequest(request));
  }
});

// Handle HTML page requests (Network First strategy)
async function handlePageRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful response
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If no cache, return offline page
    return caches.match('/index.html');
  }
}

// Handle static assets (Cache First strategy)
async function handleStaticAsset(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Update cache in background (stale-while-revalidate)
      fetch(request).then(response => {
        if (response.ok) {
          const cache = caches.open(STATIC_CACHE);
          cache.then(c => c.put(request, response));
        }
      }).catch(() => {
        // Ignore network errors for background updates
      });
      
      return cachedResponse;
    }
    
    // Not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return a placeholder or cached fallback
    return new Response('Asset not available offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Handle API requests (Network First with timeout)
async function handleAPIRequest(request) {
  try {
    // Try network with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const networkResponse = await fetch(request, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    // Cache successful API responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(JSON.stringify({
      error: 'Network unavailable',
      message: 'This request requires an internet connection',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle other requests
async function handleOtherRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Resource not available', {
      status: 503
    });
  }
}

// Background Sync for offline data
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'csv-upload-sync') {
    event.waitUntil(syncCSVUploads());
  } else if (event.tag === 'transaction-sync') {
    event.waitUntil(syncTransactions());
  } else if (event.tag === 'goal-progress-sync') {
    event.waitUntil(syncGoalProgress());
  }
});

// Sync pending CSV uploads
async function syncCSVUploads() {
  try {
    console.log('[SW] Syncing pending CSV uploads...');
    
    // Get pending uploads from IndexedDB
    const pendingUploads = await getPendingUploads();
    
    for (const upload of pendingUploads) {
      try {
        const response = await fetch('/api/csv-upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(upload.data)
        });
        
        if (response.ok) {
          // Remove from pending uploads
          await removePendingUpload(upload.id);
          console.log('[SW] CSV upload synced successfully:', upload.filename);
          
          // Notify client of successful sync
          await notifyClients({
            type: 'csv-upload-synced',
            filename: upload.filename
          });
        }
      } catch (error) {
        console.error('[SW] Failed to sync CSV upload:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Sync pending transactions
async function syncTransactions() {
  try {
    console.log('[SW] Syncing pending transactions...');
    
    const pendingTransactions = await getPendingTransactions();
    
    for (const transaction of pendingTransactions) {
      try {
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(transaction.data)
        });
        
        if (response.ok) {
          await removePendingTransaction(transaction.id);
          console.log('[SW] Transaction synced successfully:', transaction.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync transaction:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Transaction sync failed:', error);
  }
}

// Sync goal progress updates
async function syncGoalProgress() {
  try {
    console.log('[SW] Syncing goal progress updates...');
    
    const pendingUpdates = await getPendingGoalUpdates();
    
    for (const update of pendingUpdates) {
      try {
        const response = await fetch('/api/goals/progress', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(update.data)
        });
        
        if (response.ok) {
          await removePendingGoalUpdate(update.id);
          console.log('[SW] Goal progress synced successfully:', update.goalId);
        }
      } catch (error) {
        console.error('[SW] Failed to sync goal progress:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Goal progress sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', event => {
  console.log('[SW] Push message received:', event);
  
  let notificationData = {
    title: 'FinanceOS Update',
    body: 'You have new financial insights available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'general',
    data: {}
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = { ...notificationData, ...payload };
    } catch (error) {
      console.error('[SW] Error parsing push payload:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      actions: notificationData.actions || [],
      vibrate: [200, 100, 200],
      requireInteraction: notificationData.requireInteraction || false
    })
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  const action = event.action;
  const data = event.notification.data;
  
  let urlToOpen = '/';
  
  // Handle different notification actions
  if (action === 'upload-csv') {
    urlToOpen = '/csv-upload.html';
  } else if (action === 'view-goals') {
    urlToOpen = '/goals.html';
  } else if (action === 'emergency-fund') {
    urlToOpen = '/goals.html#emergency-fund';
  } else if (data && data.url) {
    urlToOpen = data.url;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.navigate(urlToOpen);
            return;
          }
        }
        
        // Open new window if app is not open
        return clients.openWindow(urlToOpen);
      })
  );
  
  // Send message to client about notification action
  event.waitUntil(
    notifyClients({
      type: 'notification-click',
      action: action,
      data: data
    })
  );
});

// Message handling for client communication
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_CACHE_STATUS':
      event.ports[0].postMessage({
        cacheSize: getCacheSize(),
        offlineReady: true
      });
      break;
      
    case 'CLEAR_CACHE':
      event.waitUntil(clearAllCaches());
      break;
      
    case 'STORE_OFFLINE_DATA':
      event.waitUntil(storeOfflineData(data));
      break;
      
    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Utility functions

function isHTMLPage(request) {
  return request.destination === 'document' || 
         request.headers.get('Accept')?.includes('text/html');
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(css|js|png|jpg|jpeg|svg|ico|woff|woff2|ttf)$/);
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/');
}

async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const name of cacheNames) {
    const cache = await caches.open(name);
    const keys = await cache.keys();
    totalSize += keys.length;
  }
  
  return totalSize;
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map(name => caches.delete(name))
  );
}

async function notifyClients(message) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage(message);
  });
}

// IndexedDB operations for offline storage
async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FinanceOSOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      
      // Create object stores
      if (!db.objectStoreNames.contains('pendingUploads')) {
        db.createObjectStore('pendingUploads', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('pendingTransactions')) {
        db.createObjectStore('pendingTransactions', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('pendingGoalUpdates')) {
        db.createObjectStore('pendingGoalUpdates', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('offlineData')) {
        db.createObjectStore('offlineData', { keyPath: 'key' });
      }
    };
  });
}

async function getPendingUploads() {
  const db = await openDB();
  const transaction = db.transaction(['pendingUploads'], 'readonly');
  const store = transaction.objectStore('pendingUploads');
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function removePendingUpload(id) {
  const db = await openDB();
  const transaction = db.transaction(['pendingUploads'], 'readwrite');
  const store = transaction.objectStore('pendingUploads');
  
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getPendingTransactions() {
  const db = await openDB();
  const transaction = db.transaction(['pendingTransactions'], 'readonly');
  const store = transaction.objectStore('pendingTransactions');
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function removePendingTransaction(id) {
  const db = await openDB();
  const transaction = db.transaction(['pendingTransactions'], 'readwrite');
  const store = transaction.objectStore('pendingTransactions');
  
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getPendingGoalUpdates() {
  const db = await openDB();
  const transaction = db.transaction(['pendingGoalUpdates'], 'readonly');
  const store = transaction.objectStore('pendingGoalUpdates');
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function removePendingGoalUpdate(id) {
  const db = await openDB();
  const transaction = db.transaction(['pendingGoalUpdates'], 'readwrite');
  const store = transaction.objectStore('pendingGoalUpdates');
  
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function storeOfflineData(data) {
  const db = await openDB();
  const transaction = db.transaction(['offlineData'], 'readwrite');
  const store = transaction.objectStore('offlineData');
  
  return new Promise((resolve, reject) => {
    const request = store.put({
      key: data.key,
      value: data.value,
      timestamp: Date.now()
    });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Periodic background tasks
self.addEventListener('periodicsync', event => {
  if (event.tag === 'financial-data-sync') {
    event.waitUntil(performPeriodicSync());
  }
});

async function performPeriodicSync() {
  console.log('[SW] Performing periodic sync...');
  
  try {
    // Sync all pending data
    await Promise.all([
      syncCSVUploads(),
      syncTransactions(),
      syncGoalProgress()
    ]);
    
    // Check for critical financial alerts
    await checkCriticalAlerts();
    
    console.log('[SW] Periodic sync completed successfully');
  } catch (error) {
    console.error('[SW] Periodic sync failed:', error);
  }
}

async function checkCriticalAlerts() {
  try {
    // Get latest financial data
    const response = await fetch('/api/financial-summary');
    
    if (response.ok) {
      const data = await response.json();
      
      // Check for critical conditions
      if (data.emergencyFund < 1000) {
        self.registration.showNotification('🚨 Emergency Fund Critical', {
          body: `Your emergency fund is only ${data.emergencyFundFormatted}. This puts you at high financial risk.`,
          icon: '/icons/icon-192x192.png',
          tag: 'emergency-fund-critical',
          requireInteraction: true,
          actions: [
            { action: 'emergency-fund', title: 'Build Emergency Fund' },
            { action: 'view-goals', title: 'View Goals' }
          ]
        });
      }
      
      if (data.monthlyDeficit > 1000) {
        self.registration.showNotification('📊 Budget Deficit Alert', {
          body: `Monthly deficit: ${data.monthlyDeficitFormatted}. Immediate action required.`,
          icon: '/icons/icon-192x192.png',
          tag: 'budget-deficit-alert',
          actions: [
            { action: 'view-goals', title: 'Fix Budget' }
          ]
        });
      }
    }
  } catch (error) {
    console.error('[SW] Failed to check critical alerts:', error);
  }
}

console.log('[SW] FinanceOS Service Worker loaded successfully');