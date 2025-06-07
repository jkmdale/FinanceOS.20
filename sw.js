// FinanceOS Service Worker
// Provides offline functionality, caching, and background sync

const CACHE_NAME = 'financeos-v1.2.0';
const STATIC_CACHE_NAME = 'financeos-static-v1.2.0';
const DYNAMIC_CACHE_NAME = 'financeos-dynamic-v1.2.0';

// Files to cache immediately (App Shell)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/csv-upload.html',
  '/goals.html',
  '/budget.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png'
];

// Files to cache on first request
const DYNAMIC_ASSETS = [
  '/styles.css',
  '/data-manager.js'
];

// Network-first resources (always try network first)
const NETWORK_FIRST = [
  '/api/',
  'https://api.openai.com/'
];

// Cache-first resources (serve from cache, update in background)
const CACHE_FIRST = [
  '/icons/',
  '/images/',
  '.png',
  '.jpg',
  '.jpeg',
  '.svg',
  '.css',
  '.js'
];

// Install Event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v1.2.0');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v1.2.0');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName.startsWith('financeos-') && 
                     cacheName !== STATIC_CACHE_NAME && 
                     cacheName !== DYNAMIC_CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      
      // Take control of all pages
      self.clients.claim()
    ])
  );
});

// Fetch Event - Handle all network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle different caching strategies based on request type
  if (isNetworkFirst(request.url)) {
    event.respondWith(networkFirst(request));
  } else if (isCacheFirst(request.url)) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Background Sync - Handle offline data synchronization
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync-transactions') {
    event.waitUntil(syncOfflineTransactions());
  } else if (event.tag === 'background-sync-goals') {
    event.waitUntil(syncOfflineGoals());
  } else if (event.tag === 'background-sync-csv-upload') {
    event.waitUntil(syncOfflineCSVUploads());
  }
});

// Push Notifications - Handle financial alerts
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: 'You have new financial insights available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View Dashboard',
        icon: '/icons/action-view.png'
      },
      {
        action: 'close',
        title: 'Dismiss',
        icon: '/icons/action-close.png'
      }
    ]
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.data = { ...options.data, ...data };
  }
  
  event.waitUntil(
    self.registration.showNotification('FinanceOS', options)
  );
});

// Notification Click - Handle notification interactions
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        // Check if app is already open
        for (const client of clients) {
          if (client.url.includes('financeos') && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if not already open
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
    );
  }
});

// Message Event - Handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
        
      case 'CACHE_CSV_DATA':
        event.waitUntil(cacheCSVData(event.data.data));
        break;
        
      case 'CACHE_TRANSACTIONS':
        event.waitUntil(cacheTransactions(event.data.transactions));
        break;
        
      case 'REQUEST_CACHE_UPDATE':
        event.waitUntil(updateCache());
        break;
    }
  }
});

// Caching Strategies

// Network First - Try network, fallback to cache
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, serving from cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || new Response('Offline', { status: 503 });
    }
    
    throw error;
  }
}

// Cache First - Serve from cache, update in background
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request).then((response) => {
      if (response.ok) {
        const cache = caches.open(DYNAMIC_CACHE_NAME);
        cache.then(c => c.put(request, response));
      }
    }).catch(() => {
      // Silently fail background update
    });
    
    return cachedResponse;
  }
  
  // Not in cache, fetch from network
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Cache miss and network failed:', request.url);
    throw error;
  }
}

// Stale While Revalidate - Serve from cache, update in background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Always try to update from network
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {
    // Silently fail network update
  });
  
  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not cached, wait for network
  return fetchPromise;
}

// Helper Functions

function isNetworkFirst(url) {
  return NETWORK_FIRST.some(pattern => url.includes(pattern));
}

function isCacheFirst(url) {
  return CACHE_FIRST.some(pattern => url.includes(pattern));
}

// Background Sync Functions

async function syncOfflineTransactions() {
  console.log('[SW] Syncing offline transactions');
  
  try {
    // Get pending transactions from IndexedDB
    const db = await openIndexedDB();
    const tx = db.transaction(['pendingTransactions'], 'readonly');
    const store = tx.objectStore('pendingTransactions');
    const pendingTransactions = await getAllFromStore(store);
    
    for (const transaction of pendingTransactions) {
      try {
        // Attempt to sync transaction
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transaction.data)
        });
        
        if (response.ok) {
          // Remove from pending after successful sync
          const deleteTx = db.transaction(['pendingTransactions'], 'readwrite');
          const deleteStore = deleteTx.objectStore('pendingTransactions');
          await deleteFromStore(deleteStore, transaction.id);
          
          console.log('[SW] Transaction synced:', transaction.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync transaction:', transaction.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

async function syncOfflineGoals() {
  console.log('[SW] Syncing offline goals');
  
  try {
    // Get pending goals from IndexedDB
    const db = await openIndexedDB();
    const tx = db.transaction(['pendingGoals'], 'readonly');
    const store = tx.objectStore('pendingGoals');
    const pendingGoals = await getAllFromStore(store);
    
    for (const goal of pendingGoals) {
      try {
        const response = await fetch('/api/goals', {
          method: goal.action,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(goal.data)
        });
        
        if (response.ok) {
          const deleteTx = db.transaction(['pendingGoals'], 'readwrite');
          const deleteStore = deleteTx.objectStore('pendingGoals');
          await deleteFromStore(deleteStore, goal.id);
          
          console.log('[SW] Goal synced:', goal.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync goal:', goal.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Goal sync failed:', error);
  }
}

async function syncOfflineCSVUploads() {
  console.log('[SW] Syncing offline CSV uploads');
  
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(['pendingCSVs'], 'readonly');
    const store = tx.objectStore('pendingCSVs');
    const pendingCSVs = await getAllFromStore(store);
    
    for (const csvUpload of pendingCSVs) {
      try {
        const formData = new FormData();
        formData.append('file', csvUpload.file);
        formData.append('metadata', JSON.stringify(csvUpload.metadata));
        
        const response = await fetch('/api/csv-upload', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const deleteTx = db.transaction(['pendingCSVs'], 'readwrite');
          const deleteStore = deleteTx.objectStore('pendingCSVs');
          await deleteFromStore(deleteStore, csvUpload.id);
          
          console.log('[SW] CSV upload synced:', csvUpload.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync CSV upload:', csvUpload.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] CSV sync failed:', error);
  }
}

// IndexedDB Helper Functions

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FinanceOS', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object stores for offline data
      if (!db.objectStoreNames.contains('pendingTransactions')) {
        db.createObjectStore('pendingTransactions', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('pendingGoals')) {
        db.createObjectStore('pendingGoals', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('pendingCSVs')) {
        db.createObjectStore('pendingCSVs', { keyPath: 'id' });
      }
      
      if (!db.objectStoreNames.contains('cachedData')) {
        db.createObjectStore('cachedData', { keyPath: 'key' });
      }
    };
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function deleteFromStore(store, id) {
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Cache Management Functions

async function cacheCSVData(data) {
  console.log('[SW] Caching CSV data');
  
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(['cachedData'], 'readwrite');
    const store = tx.objectStore('cachedData');
    
    await store.put({
      key: 'csvData',
      data: data,
      timestamp: Date.now()
    });
    
    console.log('[SW] CSV data cached successfully');
  } catch (error) {
    console.error('[SW] Failed to cache CSV data:', error);
  }
}

async function cacheTransactions(transactions) {
  console.log('[SW] Caching transactions');
  
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(['cachedData'], 'readwrite');
    const store = tx.objectStore('cachedData');
    
    await store.put({
      key: 'transactions',
      data: transactions,
      timestamp: Date.now()
    });
    
    console.log('[SW] Transactions cached successfully');
  } catch (error) {
    console.error('[SW] Failed to cache transactions:', error);
  }
}

async function updateCache() {
  console.log('[SW] Updating cache');
  
  try {
    const cache = await caches.open(STATIC_CACHE_NAME);
    
    // Update static assets
    for (const asset of STATIC_ASSETS) {
      try {
        const response = await fetch(asset);
        if (response.ok) {
          await cache.put(asset, response);
        }
      } catch (error) {
        console.warn('[SW] Failed to update asset:', asset, error);
      }
    }
    
    console.log('[SW] Cache updated successfully');
  } catch (error) {
    console.error('[SW] Cache update failed:', error);
  }
}

// Periodic Background Tasks
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'financial-health-check') {
    event.waitUntil(performFinancialHealthCheck());
  }
});

async function performFinancialHealthCheck() {
  console.log('[SW] Performing financial health check');
  
  try {
    // Get stored financial data
    const db = await openIndexedDB();
    const tx = db.transaction(['cachedData'], 'readonly');
    const store = tx.objectStore('cachedData');
    
    const goalsData = await store.get('goals');
    const transactionsData = await store.get('transactions');
    
    if (goalsData && transactionsData) {
      // Analyze financial health
      const health = analyzeFinancialHealth(goalsData.data, transactionsData.data);
      
      // Send notification if issues detected
      if (health.alerts.length > 0) {
        await self.registration.showNotification('FinanceOS Alert', {
          body: health.alerts[0],
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-96x96.png',
          tag: 'financial-alert',
          requireInteraction: true
        });
      }
    }
  } catch (error) {
    console.error('[SW] Financial health check failed:', error);
  }
}

function analyzeFinancialHealth(goals, transactions) {
  const alerts = [];
  
  // Check for emergency fund
  const emergencyFund = goals.find(g => g.name.toLowerCase().includes('emergency'));
  if (emergencyFund && emergencyFund.current < 1000) {
    alerts.push('Your emergency fund is critically low. Consider prioritizing savings.');
  }
  
  // Check for overspending patterns
  const recentTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return transactionDate > thirtyDaysAgo;
  });
  
  const totalSpending = recentTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  if (totalSpending > 5000) { // Threshold for high spending alert
    alerts.push('Your spending has been higher than usual this month.');
  }
  
  return { alerts };
}

console.log('[SW] FinanceOS Service Worker v1.2.0 loaded');